import React, { useState } from 'react';
import { Hash } from 'lucide-react';

export function CreateRoom({ onJoin }: { onJoin: (roomId: string, userName: string) => void }) {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [mode, setMode] = useState<'join' | 'create'>('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    if (mode === 'create') {
      const newRoom = Math.random().toString(36).substring(2, 10);
      onJoin(newRoom, userName);
    } else {
      if (!roomId.trim()) return;
      onJoin(roomId, userName);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D11] flex items-center justify-center p-4 font-sans relative overflow-hidden text-[#E0E0E0]">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5865F2]/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#23A559]/20 rounded-full blur-[120px]"></div>

      <div className="bg-[#111214] w-full max-w-md p-8 rounded-lg shadow-2xl relative z-10 border border-[#2D2F34]">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#5865F2] rounded-[16px] flex items-center justify-center transform rotate-3">
            <Hash size={36} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400 text-center text-sm mb-8">We're so excited to see you again!</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              DISPLAY NAME <span className="text-[#F23F42]">*</span>
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full bg-[#1E1F22] text-white border border-[#2D2F34] rounded min-h-[40px] px-3 outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          <div className="flex bg-[#1E1F22] rounded-md p-1 border border-[#2D2F34]">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${mode === 'create' ? 'bg-[#35373C] text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Create Server
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${mode === 'join' ? 'bg-[#35373C] text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Join Server
            </button>
          </div>

          {mode === 'join' && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                INVITE LINK OR SERVER ID <span className="text-[#F23F42]">*</span>
              </label>
              <input
                type="text"
                required={mode === 'join'}
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="h3x4n1m"
                className="w-full bg-[#1E1F22] text-white border border-[#2D2F34] rounded min-h-[40px] px-3 outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#5865F2] hover:bg-indigo-600 text-white font-semibold py-3 rounded transition-colors disabled:opacity-50"
            disabled={!userName.trim() || (mode === 'join' && !roomId.trim())}
          >
            {mode === 'create' ? 'Create My Server' : 'Join Server'}
          </button>
        </form>
      </div>
    </div>
  );
}
