import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type PeerConnection = {
  peerId: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  userName?: string;
};

export function useWebRTC(roomId: string, userId: string, userName: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const [messages, setMessages] = useState<{ id: string, text: string, senderName: string, senderId: string, timestamp: number }[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const peersRef = useRef<PeerConnection[]>([]);

  // We need a stable reference to socket to use in callbacks without re-capturing
  const socketRef = useRef<Socket | null>(null);

  const getIceConfig = () => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  });

  const addPeer = useCallback((peerId: string, pc: RTCPeerConnection, userName?: string) => {
    peersRef.current = [...peersRef.current, { peerId, pc, userName }];
    setPeers([...peersRef.current]);
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.find(p => p.peerId === peerId);
    if (peer) {
      peer.pc.close();
    }
    peersRef.current = peersRef.current.filter(p => p.peerId !== peerId);
    setPeers([...peersRef.current]);
  }, []);

  const setPeerStream = useCallback((peerId: string, stream: MediaStream) => {
    peersRef.current = peersRef.current.map(p => 
      p.peerId === peerId ? { ...p, stream } : p
    );
    setPeers([...peersRef.current]);
  }, []);

  const setPeerName = useCallback((peerId: string, name: string) => {
    peersRef.current = peersRef.current.map(p => 
      p.peerId === peerId ? { ...p, userName: name } : p
    );
    setPeers([...peersRef.current]);
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;

    // Connect to WebSockets
    const s = io(window.location.origin);
    setSocket(s);
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join-room', roomId, userId, userName);
    });

    s.on('user-connected', async ({ userId: newUserId, userName: newUserName, socketId: newSocketId }) => {
      console.log('New user connected:', newUserId, newUserName);
      // We are the existing user, we create an offer to the new user.
      // But actually, we need a reliable way to map socket IDs to user IDs.
      // Let's use the socketId as the peerId for signaling logic to avoid confusion.
      const peerId = newSocketId;
      
      const pc = new RTCPeerConnection(getIceConfig());
      
      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      pc.onicecandidate = event => {
        if (event.candidate) {
          s.emit('signal', { to: peerId, from: s.id, signal: { candidate: event.candidate } });
        }
      };

      pc.ontrack = event => {
        setPeerStream(peerId, event.streams[0]);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Tell them our name inside the signal or keep it simple.
      s.emit('signal', { to: peerId, from: s.id, signal: { type: 'offer', sdp: offer, userName } });
      
      addPeer(peerId, pc, newUserName);
    });

    s.on('signal', async (data) => {
      const { signal, from } = data;
      const peerId = from;
      
      let pc = peersRef.current.find(p => p.peerId === peerId)?.pc;

      if (!pc && signal.type === 'offer') {
        // We are the new user receiving an offer
        pc = new RTCPeerConnection(getIceConfig());
        addPeer(peerId, pc, signal.userName);

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
             if (localStreamRef.current) {
               pc!.addTrack(track, localStreamRef.current);
             }
          });
        }

        pc.onicecandidate = event => {
          if (event.candidate) {
            s.emit('signal', { to: peerId, from: s.id, signal: { candidate: event.candidate } });
          }
        };

        pc.ontrack = event => {
          setPeerStream(peerId, event.streams[0]);
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        s.emit('signal', { to: peerId, from: s.id, signal: { type: 'answer', sdp: answer, userName } });
      } else if (pc) {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          s.emit('signal', { to: peerId, from: s.id, signal: { type: 'answer', sdp: answer, userName } });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          setPeerName(peerId, signal.userName);
        } else if (signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        }
      }
    });

    s.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    s.on('user-disconnected', ({ socketId }) => {
      removePeer(socketId);
    });

    return () => {
      peersRef.current.forEach(p => p.pc.close());
      setPeers([]);
      peersRef.current = [];
      s.disconnect();
    };
  }, [roomId, userId, userName, addPeer, setPeerName, setPeerStream]);

  const sendMessage = (text: string) => {
    if (socket && text.trim()) {
      socket.emit('send-message', {
        id: Math.random().toString(36).substring(7),
        text,
        senderName: userName,
        senderId: userId,
        timestamp: Date.now()
      });
    }
  };

  const startMedia = async (screenShare = false) => {
    try {
      const stream = screenShare 
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      localStreamRef.current = stream;
      setLocalStreamState(stream);
      
      // Update all existing peer connections with new tracks
      peersRef.current.forEach(peer => {
        // Remove old tracks
        peer.pc.getSenders().forEach(sender => peer.pc.removeTrack(sender));
        
        // Add new tracks
        stream.getTracks().forEach(track => {
          peer.pc.addTrack(track, stream);
        });
      });

      // Need WebRTC negotiation again
      peersRef.current.forEach(async (peer) => {
        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        if (socketRef.current) {
          socketRef.current.emit('signal', { to: peer.peerId, from: socketRef.current.id, signal: { type: 'offer', sdp: offer, userName } });
        }
      });

      return stream;
    } catch (err) {
      console.error('Failed to get media', err);
      return null;
    }
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      
      // Remove tracks from peer connections
      peersRef.current.forEach(peer => {
        peer.pc.getSenders().forEach(sender => peer.pc.removeTrack(sender));
      });

      // Renegotiate after removal
      peersRef.current.forEach(async (peer) => {
        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        if (socketRef.current) {
          socketRef.current.emit('signal', { to: peer.peerId, from: socketRef.current.id, signal: { type: 'offer', sdp: offer, userName } });
        }
      });

      localStreamRef.current = null;
      setLocalStreamState(null);
    }
  };

  return {
    peers,
    messages,
    sendMessage,
    startMedia,
    stopMedia,
    localStream
  };
}
