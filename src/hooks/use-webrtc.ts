// src/hooks/use-webrtc.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, child, remove, serverTimestamp, get, push as firebasePush, goOffline, goOnline } from 'firebase/database';
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
    if (localStream) {
        Object.values(peerConnections.current).forEach(pc => {
            localStream.getTracks().forEach(track => {
                const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
                if(sender) {
                    sender.replaceTrack(track);
                } else {
                    pc.addTrack(track, localStream);
                }
            })
        });
    }
}, [localStream]);

  const handleNewParticipant = useCallback(async (participantId: string, participantName: string) => {
    if (!user || participantId === user.uid || !localStreamRef.current || peerConnections.current[participantId]) {
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
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const iceCandidateRef = ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates/${participantId}`);
        const candidatePushRef = firebasePush(child(iceCandidateRef, event.candidate.sdpMid!));
        set(candidatePushRef, event.candidate.toJSON());
      }
    };
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    const offerRef = ref(db, `meetings/${meetingId}/users/${user.uid}/offers/${participantId}`);
    await set(offerRef, { type: 'offer', sdp: pc.localDescription?.sdp });

  }, [user, meetingId]);

  useEffect(() => {
    if (!user || !meetingId) return;

    goOnline(db);

    const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
    const presenceRef = ref(db, `.info/connected`);
    const usersRef = ref(db, `meetings/${meetingId}/users`);
    const hostRef = ref(db, `meetings/${meetingId}/host`);

    const setup = async () => {
      const hostSnapshot = await get(hostRef);
      if (!hostSnapshot.exists()) {
        await set(hostRef, user.uid);
        setIsHost(true);
        onDisconnect(hostRef).remove();
      } else {
        setIsHost(hostSnapshot.val() === user.uid);
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
      }
    });

    const unSubUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const otherUsers: Participant[] = [];
      if (usersData) {
          for(const uid in usersData) {
              if (uid !== user.uid && usersData[uid].online) {
                  otherUsers.push({
                      id: uid,
                      name: usersData[uid].name,
                      email: usersData[uid].email,
                      isMuted: usersData[uid].isMuted || false,
                      isCameraOff: usersData[uid].isCameraOff || false,
                      isSharingScreen: usersData[uid].isSharingScreen || false,
                  });
              }
          }
      }

      setParticipants(currentParticipants => {
          const newParticipantIds = new Set(otherUsers.map(u => u.id));
          const oldParticipantIds = new Set(currentParticipants.map(p => p.id));
          
          let updatedParticipants = currentParticipants.filter(p => newParticipantIds.has(p.id));

          otherUsers.forEach(newUser => {
              const existingParticipant = updatedParticipants.find(p => p.id === newUser.id);
              if (existingParticipant) {
                  Object.assign(existingParticipant, newUser);
              } else {
                  updatedParticipants.push(newUser);
              }
          });

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
          return updatedParticipants;
        });

    });

    const unSubOffers = onValue(ref(db, `meetings/${meetingId}/users/${user.uid}/offers`), async (snapshot) => {
      if(!snapshot.exists()) return;

      const offers = snapshot.val();
      for (const fromId in offers) {
        if(!user || !localStreamRef.current) continue;

        const { sdp, type } = offers[fromId];
        let pc = peerConnections.current[fromId];

        if (!pc) {
          pc = new RTCPeerConnection(ICE_SERVERS);
          peerConnections.current[fromId] = pc;
          localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
          pc.ontrack = (event) => {
             setParticipants(prev =>
               prev.map(p =>
                 p.id === fromId ? { ...p, stream: event.streams[0] } : p
               )
             );
          };
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const iceCandidateRef = ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates/${fromId}`);
              const candidatePushRef = firebasePush(child(iceCandidateRef, event.candidate.sdpMid!));
              set(candidatePushRef, event.candidate.toJSON());
            }
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
        
        if (type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const answerRef = ref(db, `meetings/${meetingId}/users/${fromId}/offers/${user.uid}`);
          await set(answerRef, { type: 'answer', sdp: pc.localDescription?.sdp });
        }
        
        remove(ref(db, `meetings/${meetingId}/users/${user.uid}/offers/${fromId}`));
      }
    });
    
    const unSubIce = onValue(ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates`), async (snapshot) => {
      if(!snapshot.exists()) return;
      const candidatesByPeer = snapshot.val();
      for (const peerId in candidatesByPeer) {
        const pc = peerConnections.current[peerId];
        if (pc && pc.remoteDescription) {
          const candidatesBySdpMid = candidatesByPeer[peerId];
          for (const sdpMid in candidatesBySdpMid) {
            const candidates = candidatesBySdpMid[sdpMid];
            for(const key in candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidates[key]));
              } catch(e){
                console.error("Error adding received ICE candidate", e);
              }
            }
          }
          remove(ref(db, `meetings/${meetingId}/users/${user.uid}/iceCandidates/${peerId}`));
        }
      }
    });

    return () => {
      if (user) {
        const userRef = ref(db, `meetings/${meetingId}/users/${user.uid}`);
        remove(userRef);
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      setParticipants([]);
      goOffline(db);
      
      onHostChange();
      onPresenceChange();
      unSubUsers();
      unSubOffers();
      unSubIce();
    };
  }, [user, meetingId, handleNewParticipant]);

  const toggleMedia = (kind: 'audio' | 'video' | 'screen') => {
    const userRef = ref(db, `meetings/${meetingId}/users/${user?.uid}`);
    if (kind === 'audio' || kind === 'video') {
        if(localStreamRef.current){
            const track = kind === 'audio' ? localStreamRef.current.getAudioTracks()[0] : localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                if(kind === 'audio'){
                    set(child(userRef, 'isMuted'), !track.enabled);
                } else {
                    set(child(userRef, 'isCameraOff'), !track.enabled);
                }
            }
        }
    } else if (kind === 'screen') {
        get(child(userRef, 'isSharingScreen')).then(snapshot => {
            set(child(userRef, 'isSharingScreen'), !snapshot.val());
        });
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
    goOffline(db);
  }, [user, meetingId]);


  return { participants, toggleMedia, isHost, chatRef, listenForMessages, cleanup };
}
