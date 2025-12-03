import { Mic, Square } from 'lucide-react';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export function MicrophoneButton({ isRecording, onClick }: MicrophoneButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center w-48 h-48 rounded-full 
        transition-all duration-500 shadow-2xl focus:outline-none 
        touch-manipulation
        ${isRecording 
          ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 scale-105' 
          : 'bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-blue-500/40 hover:scale-105 active:scale-95'
        }
      `}
      aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
    >
      {/* Ripple Effect when recording */}
      {isRecording && (
        <>
          <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-20 duration-1000 delay-0"></span>
          <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-20 duration-1000 delay-300"></span>
        </>
      )}
      
      {/* Ambient Glow when idle */}
      {!isRecording && (
        <span className="absolute w-full h-full rounded-full bg-blue-400 opacity-20 animate-pulse"></span>
      )}
      
      <div className="relative z-10 pointer-events-none">
        {isRecording ? (
          <Square className="w-20 h-20 text-white fill-current drop-shadow-lg" />
        ) : (
          <Mic className="w-24 h-24 text-white drop-shadow-lg" />
        )}
      </div>
    </button>
  );
}

