import React, { useRef, useEffect } from 'react';

export const VideoPlayer = ({ stream, userName, isLocal }: { stream?: MediaStream, userName: string, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-[#000000] rounded-lg overflow-hidden flex flex-col justify-center items-center h-full min-h-[200px] border border-[#2D2F34]">
      {stream ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-20 h-20 bg-[#5865F2] rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-md text-sm font-medium text-white flex items-center gap-2 border border-white/10">
        <div className="w-2 h-2 rounded-full bg-[#23A559]"></div>
        {userName} {isLocal && '(You)'}
      </div>
    </div>
  );
};
