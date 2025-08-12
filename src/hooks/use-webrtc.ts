// src/hooks/use-webrtc.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, get, child, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth.tsx';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(meetingId: string, localStream: MediaStream | null) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const meetingRef = ref(db, `meetings/${meetingId}`);

  const handleNewParticipant = useCallback(async (participantId: string, name: string) => {
    if (!user || participantId === user.uid || !localStream) return;

    console.log(`New participant joined: ${name} (${participantId})`);
    
    if (peerConnections.current[participantId]) {
      console.log(`Peer connection for ${participantId} already exists. Closing old one.`);
      peerConnections.current[participantId].close();
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[participantId] = pc;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      console.log('Remote track received from:', participantId);
      setParticipants(prev =>
        prev.map(p =>
          p.id === participantId ? { ...p, stream: event.streams[0] } : p
        )
      );
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    const offerRef = ref(db, `meetings/${meetingId}/users/${user.uid}/offers/${participantId}`);
    await set(offerRef, { type: 'offer', sdp: pc.localDescription?.sdp });
    
    const iceCandidateRef = ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates/${participantId}`);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        set(child(iceCandidateRef, event.candidate.sdpMid!), { ...event.candidate.toJSON() });
      }
    };

  }, [user, meetingId, localStream]);

  useEffect(() => {
    if (!user || !meetingId || !localStream) return;

    const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
    const presenceRef = ref(db, `.info/connected`);
    const usersRef = ref(db, `meetings/${meetingId}/users`);

    onValue(presenceRef, (snap) => {
      if (snap.val() === true) {
        set(userRef, { name: user.displayName || "Anonymous", online: true, id: user.uid });
        onDisconnect(userRef).remove();
      }
    });

    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const otherUsers = Object.keys(usersData)
          .filter(uid => uid !== user.uid)
          .map(uid => ({
            id: uid,
            name: usersData[uid].name,
            isMuted: usersData[uid].isMuted || false,
            isCameraOff: usersData[uid].isCameraOff || false,
          }));
        
        setParticipants(currentParticipants => {
          const newParticipants = otherUsers.filter(u => !currentParticipants.find(p => p.id === u.id));
          const removedParticipants = currentParticipants.filter(p => !otherUsers.find(u => u.id === p.id) && p.id !== user.uid);
          
          newParticipants.forEach(p => handleNewParticipant(p.id, p.name));
          removedParticipants.forEach(p => {
             if (peerConnections.current[p.id]) {
                peerConnections.current[p.id].close();
                delete peerConnections.current[p.id];
             }
          });
          return otherUsers;
        });
      } else {
        setParticipants([]);
      }
    });

    const offersRef = ref(db, `meetings/${meetingId}/users/${user.uid}/offers`);
    onValue(offersRef, async (snapshot) => {
      const offers = snapshot.val();
      for (const fromId in offers) {
        if(!user) continue;

        const { sdp, type } = offers[fromId];
        const pc = peerConnections.current[fromId] || new RTCPeerConnection(ICE_SERVERS);
        if (!peerConnections.current[fromId]) {
          peerConnections.current[fromId] = pc;
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
          pc.ontrack = (event) => {
             setParticipants(prev =>
               prev.map(p =>
                 p.id === fromId ? { ...p, stream: event.streams[0] } : p
               )
             );
          };
          const iceCandidateRef = ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates/${fromId}`);
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              set(child(iceCandidateRef, event.candidate.sdpMid!), { ...event.candidate.toJSON() });
            }
          };
        }

        if (type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const answerRef = ref(db, `meetings/${meetingId}/users/${fromId}/offers/${user.uid}`);
          await set(answerRef, { type: 'answer', sdp: pc.localDescription?.sdp });
        } else if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
        }
        remove(child(offersRef, fromId));
      }
    });
    
    const iceCandidatesRef = ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates`);
    onValue(iceCandidatesRef, async (snapshot) => {
      const candidatesByPeer = snapshot.val();
      if (candidatesByPeer) {
        for (const peerId in candidatesByPeer) {
          const candidates = candidatesByPeer[peerId];
          const pc = peerConnections.current[peerId];
          if (pc) {
            for (const mid in candidates) {
              await pc.addIceCandidate(new RTCIceCandidate(candidates[mid]));
            }
            remove(child(iceCandidatesRef, peerId));
          }
        }
      }
    });

    return () => {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      remove(userRef);
      setParticipants([]);
    };
  }, [user, meetingId, localStream, handleNewParticipant]);

  const toggleMedia = (kind: 'audio' | 'video') => {
    if (localStream) {
      const track = kind === 'audio' ? localStream.getAudioTracks()[0] : localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        const userRef = ref(db, `meetings/${meetingId}/users/${user?.uid}`);
        if(kind === 'audio'){
            set(child(userRef, 'isMuted'), !track.enabled);
        } else {
            set(child(userRef, 'isCameraOff'), !track.enabled);
        }
      }
    }
  };


  return { participants, toggleMedia };
}
