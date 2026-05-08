import React, { useState, useEffect } from 'react';
import { CreateRoom } from './components/CreateRoom';
import { Room } from './components/Room';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Check URL for room joined
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && !roomId) {
      setRoomId(room);
    }
  }, [roomId]);

  const handleJoin = (id: string, name: string) => {
    setRoomId(id);
    setUserName(name);
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('room', id);
    window.history.pushState({}, '', url.toString());
  };

  if (!roomId || !userName) {
    return <CreateRoom onJoin={handleJoin} />;
  }

  return <Room roomId={roomId} userName={userName} />;
}
