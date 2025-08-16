// src/hooks/use-webrtc.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, child, remove, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth.tsx';

interface Participant {
  id: string;
  name: string;
  email?: string;
  stream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
}

export interface Message {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
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
  const [isHost, setIsHost] = useState(false);
  const [canOthersShare, setCanOthersShare] = useState(false);
  
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const meetingRef = ref(db, `meetings/${meetingId}`);
  const chatRef = ref(db, `meetings/${meetingId}/chat`);

  const handleNewParticipant = useCallback(async (participantId: string, name: string) => {
    if (!user || participantId === user.uid || !localStream) return;

    if (peerConnections.current[participantId]) {
      peerConnections.current[participantId].close();
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[participantId] = pc;

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
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
    if (!user || !meetingId) return;

    const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
    const presenceRef = ref(db, `.info/connected`);
    const usersRef = ref(db, `meetings/${meetingId}/users`);
    const hostRef = ref(db, `meetings/${meetingId}/host`);
    const screenSharePolicyRef = ref(db, `meetings/${meetingId}/config/canOthersShare`);

    onValue(hostRef, (snapshot) => {
        const hostId = snapshot.val();
        if(!hostId) {
            set(hostRef, user.uid);
            setIsHost(true);
            set(screenSharePolicyRef, true);
        } else {
            setIsHost(hostId === user.uid);
        }
    });

    onValue(screenSharePolicyRef, (snapshot) => {
        setCanOthersShare(snapshot.val() ?? false);
    });

    onValue(presenceRef, (snap) => {
      if (snap.val() === true) {
        set(userRef, { name: user.displayName || "Anonymous", email: user.email, online: true, id: user.uid });
        onDisconnect(userRef).remove();
        onDisconnect(hostRef).get().then(snapshot => {
            if (snapshot.val() === user.uid) {
                remove(hostRef);
            }
        });
      }
    });

    const unSubUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const otherUsers = Object.keys(usersData)
          .filter(uid => uid !== user.uid && usersData[uid].online)
          .map(uid => ({
            id: uid,
            name: usersData[uid].name,
            email: usersData[uid].email,
            isMuted: usersData[uid].isMuted || false,
            isCameraOff: usersData[uid].isCameraOff || false,
            isSharingScreen: usersData[uid].isSharingScreen || false,
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

    const unSubOffers = onValue(ref(db, `meetings/${meetingId}/users/${user.uid}/offers`), async (snapshot) => {
      const offers = snapshot.val();
      if(!offers || !localStream) return;
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
        remove(ref(db, `meetings/${meetingId}/users/${user.uid}/offers/${fromId}`));
      }
    });
    
    const unSubIce = onValue(ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates`), async (snapshot) => {
      const candidatesByPeer = snapshot.val();
      if (candidatesByPeer) {
        for (const peerId in candidatesByPeer) {
          const candidates = candidatesByPeer[peerId];
          const pc = peerConnections.current[peerId];
          if (pc && pc.remoteDescription) {
            for (const mid in candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidates[mid]));
              } catch(e){
                console.error("Error adding received ICE candidate", e);
              }
            }
            remove(ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates/${peerId}`));
          }
        }
      }
    });

    return () => {
      unSubUsers();
      unSubOffers();
      unSubIce();
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      remove(userRef);
      setParticipants([]);
    };
  }, [user, meetingId, localStream, handleNewParticipant]);

  const toggleMedia = (kind: 'audio' | 'video' | 'screen') => {
    if (localStream && (kind === 'audio' || kind === 'video')) {
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
    if (kind === 'screen' && user) {
        const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
        set(child(userRef, 'isSharingScreen'), localStream?.getVideoTracks()[0]?.enabled || false);
    }
  };

  const toggleOthersCanShare = () => {
      if (isHost) {
          set(ref(db, `meetings/${meetingId}/config/canOthersShare`), !canOthersShare);
      }
  }


  return { participants, toggleMedia, isHost, canOthersShare, toggleOthersCanShare, chatRef };
}
