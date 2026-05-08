import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoPlayer } from './VideoPlayer';
import { Send, MonitorUp, Video, Mic, Hash, Users, Settings, HashIcon } from 'lucide-react';
import { format } from 'date-fns';

export function Room({ roomId, userName }: { roomId: string, userName: string }) {
  // Generate a random stable user ID
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const { peers, messages, sendMessage, startMedia, stopMedia, localStream } = useWebRTC(roomId, userId, userName);
  const [text, setText] = useState('');
  const [sharing, setSharing] = useState<'video' | 'screen' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text);
      setText('');
    }
  };

  const toggleVideo = async () => {
    if (sharing === 'video') {
      await stopMedia();
      setSharing(null);
    } else {
      await stopMedia();
      const stream = await startMedia(false);
      if (stream) setSharing('video');
    }
  };

  const toggleScreen = async () => {
    if (sharing === 'screen') {
      await stopMedia();
      setSharing(null);
    } else {
      await stopMedia();
      const stream = await startMedia(true);
      if (stream) setSharing('screen');
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0D11] text-[#E0E0E0] font-sans overflow-hidden">
      {/* Sidebar Channels */}
      <div className="w-[72px] bg-[#020203] flex flex-col items-center py-3 space-y-2 flex-shrink-0">
        <div className="w-12 h-12 bg-[#5865F2] rounded-[16px] flex items-center justify-center text-white font-bold cursor-pointer hover:rounded-[12px] transition-all">
          <HashIcon size={24} />
        </div>
        <div className="w-8 h-[2px] bg-[#2D2F34] rounded-full mx-auto my-1"></div>
        <div className="w-12 h-12 bg-[#2D2F34] rounded-[24px] flex items-center justify-center text-[#23A559] hover:bg-[#23A559] hover:text-white hover:rounded-[16px] transition-all cursor-pointer">
          <span className="text-2xl">+</span>
        </div>
      </div>

      {/* Main Sidebar */}
      <div className="w-60 bg-[#111214] flex flex-col flex-shrink-0">
        <div className="h-12 border-b border-[#0B0D11] flex items-center px-4 font-semibold text-white shadow-sm">
          Server {roomId.substring(0, 4)}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Voice Channels</h3>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#35373C] rounded text-white cursor-pointer">
              <span className="text-gray-400">🔊</span>
              <span>General</span>
            </div>
            
            <div className="ml-6 mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span>{userName} (You)</span>
              </div>
              
              {peers.map(peer => (
                <div key={peer.peerId} className="flex items-center gap-2 text-sm text-gray-300 hover:text-gray-200 cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
                    {peer.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span>{peer.userName || 'Connecting...'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Voice Controls */}
        <div className="h-[52px] bg-[#1E1F22] px-2 flex items-center justify-between mt-auto">
          <div className="flex items-center overflow-hidden flex-1">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex-shrink-0 flex items-center justify-center text-white font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col truncate ml-2">
              <span className="text-xs font-bold text-white truncate">{userName}</span>
              <span className="text-[10px] text-gray-400 truncate">#{(userId).substring(0, 4)}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="w-6 h-6 hover:bg-[#35373C] rounded flex items-center justify-center cursor-pointer opacity-70 text-gray-400" title="Settings">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1E1F22] relative">
        {/* Top Header */}
        <div className="h-12 border-b border-[#0B0D11] flex items-center px-4 font-semibold text-white gap-2 shrink-0">
          <Hash size={20} className="text-gray-400" />
          <span>general-chat</span>
        </div>

        {/* Media / Video Grid Area (Only show if someone is sharing) */}
        {(sharing || peers.some(p => p.stream)) && (
          <div className="p-4 bg-black/50 border-b border-[#2D2F34] flex-shrink-0 max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharing && (
                <div className="aspect-video relative">
                  <VideoPlayer stream={localStream || undefined} userName={userName} isLocal />
                </div>
              )}
              {peers.map(peer => (
                <div key={peer.peerId} className="aspect-video relative">
                  <VideoPlayer stream={peer.stream} userName={peer.userName || 'User'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="mb-8 select-none">
            <div className="w-16 h-16 bg-[#2D2F34] rounded-full flex items-center justify-center text-white mb-4">
              <Hash size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to #general-chat!</h1>
            <p className="text-gray-400 mb-4">This is the start of the #general-chat channel. Invite friends to connect.</p>
            <button 
              onClick={(e) => {
                navigator.clipboard.writeText(window.location.href);
                const btn = e.currentTarget;
                const orig = btn.innerText;
                btn.innerText = 'Copied!';
                btn.classList.replace('bg-[#5865F2]', 'bg-[#23A559]');
                btn.classList.replace('hover:bg-indigo-600', 'hover:bg-[#1a8545]');
                setTimeout(() => {
                  btn.innerText = orig;
                  btn.classList.replace('bg-[#23A559]', 'bg-[#5865F2]');
                  btn.classList.replace('hover:bg-[#1a8545]', 'hover:bg-indigo-600');
                }, 2000);
              }}
              className="bg-[#5865F2] hover:bg-indigo-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
            >
              Copy Invite Link
            </button>
          </div>

          {messages.map((m, i) => {
            const isSameUser = i > 0 && messages[i - 1].senderId === m.senderId;
            // Simple grouping logic for UI
            if (isSameUser) {
              return (
                <div key={m.id} className="group flex pl-[3.25rem] pr-4 py-0.5 hover:bg-[#2D2F34]">
                   <div className="w-12 text-center text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 mt-1 select-none flex-shrink-0 absolute left-4">
                     {format(m.timestamp, 'HH:mm')}
                   </div>
                   <div className="text-gray-300 break-words w-full text-sm">{m.text}</div>
                </div>
              )
            }
            return (
              <div key={m.id} className="flex gap-4 mt-3 hover:bg-[#2D2F34]/50 pr-4 py-1">
                <div className="w-10 h-10 rounded-full bg-[#5865F2] flex-shrink-0 flex items-center justify-center text-white font-medium mt-0.5 select-none">
                  {m.senderName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-white hover:underline cursor-pointer">{m.senderName}</span>
                    <span className="text-[10px] text-gray-500 select-none">{format(m.timestamp, 'MM/dd/yyyy HH:mm')}</span>
                  </div>
                  <div className="text-sm text-gray-300 break-words">{m.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 shrink-0 mt-auto">
          <form onSubmit={handleSend} className="bg-[#2D2F34] rounded-lg flex items-center px-4 py-2 shadow-sm">
            <button type="button" className="text-gray-400 hover:text-gray-200 mr-2">
              <div className="w-6 h-6 bg-gray-500 rounded-full flex justify-center items-center text-[#2D2F34] font-bold">+</div>
            </button>
            <input 
              type="text" 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Message #general-chat" 
              className="bg-transparent flex-1 outline-none text-sm text-gray-200 placeholder-gray-500"
            />
            <button type="submit" disabled={!text.trim()} className="text-gray-400 hover:text-gray-200 ml-4 disabled:opacity-50">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Users */}
      <div className="w-[300px] bg-[#1E1F22] border-l border-[#0B0D11] hidden lg:flex flex-col flex-shrink-0">
        <div className="p-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wide">Online — {peers.length + 1}</h3>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#2D2F34] rounded cursor-pointer group">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#23A559] border-2 border-[#1E1F22] rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">{userName}</span>
            </div>

            {peers.map(peer => (
              <div key={peer.peerId} className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#2D2F34] rounded cursor-pointer group">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm">
                    {peer.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#23A559] border-2 border-[#1E1F22] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200">{peer.userName || 'Connecting...'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons for Media */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur px-6 py-3 rounded-full border border-[#2D2F34] shadow-2xl z-50">
        <button 
          onClick={toggleVideo} 
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${sharing === 'video' ? 'bg-[#5865F2] text-white' : 'bg-[#2D2F34] text-white hover:bg-[#35373C]'}`}
          title="Share Camera"
        >
          <Video size={24} />
        </button>
        <button 
          onClick={toggleScreen} 
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${sharing === 'screen' ? 'bg-[#5865F2] text-white' : 'bg-[#2D2F34] text-white hover:bg-[#35373C]'}`}
          title="Share Screen"
        >
          <MonitorUp size={24} />
        </button>
      </div>

    </div>
  );
}
