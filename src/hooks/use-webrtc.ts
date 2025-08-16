// src/hooks/use-webrtc.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, child, remove, serverTimestamp, get, push as firebasePush } from 'firebase/database';
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
  id: string;
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
  
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const meetingRef = ref(db, `meetings/${meetingId}`);
  const chatRef = ref(db, `meetings/${meetingId}/chat`);
  const localStreamRef = useRef(localStream);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const handleNewParticipant = useCallback(async (participantId: string, name: string) => {
    if (!user || participantId === user.uid || !localStreamRef.current) return;

    if (peerConnections.current[participantId]) {
      // Connection already exists
      return;
    }
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[participantId] = pc;

    localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

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
        const candidateRef = child(iceCandidateRef, event.candidate.sdpMid!);
        firebasePush(candidateRef, event.candidate.toJSON());
      }
    };

  }, [user, meetingId]);

  useEffect(() => {
    if (!user || !meetingId) return;

    const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
    const presenceRef = ref(db, `.info/connected`);
    const usersRef = ref(db, `meetings/${meetingId}/users`);
    const hostRef = ref(db, `meetings/${meetingId}/host`);

    const setup = async () => {
      // Check if a host is already set
      const hostSnapshot = await get(hostRef);
      const hostId = hostSnapshot.val();
      
      if (!hostId) {
        // If no host, the current user becomes the host.
        await set(hostRef, user.uid);
        setIsHost(true);
      } else {
        // If a host exists, check if it's the current user.
        setIsHost(hostId === user.uid);
      }
    };
    setup();
    
    const onHostChange = onValue(hostRef, (snapshot) => {
        const hostId = snapshot.val();
        setIsHost(hostId === user.uid);
    });

    const onPresenceChange = onValue(presenceRef, (snap) => {
      if (snap.val() === true) {
        set(userRef, { name: user.displayName || "Anonymous", email: user.email, online: true, id: user.uid, isMuted: false, isCameraOff: false, isSharingScreen: false });
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
          const newParticipantIds = new Set(otherUsers.map(u => u.id));
          const oldParticipantIds = new Set(currentParticipants.map(p => p.id));
          
          // New users
          otherUsers.forEach(p => {
              if(!oldParticipantIds.has(p.id)) {
                handleNewParticipant(p.id, p.name);
              }
          });

          // Users who left
          currentParticipants.forEach(p => {
             if (!newParticipantIds.has(p.id) && peerConnections.current[p.id]) {
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
      if(!offers || !localStreamRef.current) return;
      for (const fromId in offers) {
        if(!user) continue;

        const { sdp, type } = offers[fromId];
        const pc = peerConnections.current[fromId] || new RTCPeerConnection(ICE_SERVERS);
        if (!peerConnections.current[fromId]) {
          peerConnections.current[fromId] = pc;
          localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
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
              const candidateRef = child(iceCandidateRef, event.candidate.sdpMid!);
              firebasePush(candidateRef, event.candidate.toJSON());
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
            for (const key in candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidates[key]));
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
      onHostChange();
      onPresenceChange();
      unSubUsers();
      unSubOffers();
      unSubIce();
      if (userRef) remove(userRef);
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setParticipants([]);
    };
  }, [user, meetingId, handleNewParticipant]);

  const toggleMedia = (kind: 'audio' | 'video' | 'screen', value?: boolean) => {
    const userRef = ref(db, `meetings/${meetingId}/users/${user?.uid}`);
    if (localStreamRef.current && (kind === 'audio' || kind === 'video')) {
      const track = kind === 'audio' ? localStreamRef.current.getAudioTracks()[0] : localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = value !== undefined ? value : !track.enabled;
        if(kind === 'audio'){
            set(child(userRef, 'isMuted'), !track.enabled);
        } else {
            set(child(userRef, 'isCameraOff'), !track.enabled);
        }
      }
    }
    if (kind === 'screen' && user) {
        set(child(userRef, 'isSharingScreen'), value);
    }
  };

  const listenForMessages = useCallback((callback: (messages: Message[]) => void) => {
    const messagesRef = ref(db, `meetings/${meetingId}/chat`);
    return onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val();
      const messageList: Message[] = messagesData ? Object.entries(messagesData).map(([id, msg]: [string, any]) => ({ id, ...msg })) : [];
      messageList.sort((a, b) => a.timestamp - b.timestamp);
      callback(messageList);
    });
  }, [meetingId]);

  const cleanup = useCallback(() => {
    if(user) {
        const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
        remove(userRef);
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
  }, [user, meetingId]);


  return { participants, toggleMedia, isHost, chatRef, listenForMessages, cleanup };
}
