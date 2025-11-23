import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { TimerState } from '../types';
import { formatTime } from '../utils/format';

interface ActiveTimerProps {
  timer: TimerState;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
}

const ActiveTimer: React.FC<ActiveTimerProps> = ({ timer, onPause, onResume, onStop }) => {
  const [displayTime, setDisplayTime] = useState<number>(timer.accumulatedTime);
  const requestRef = useRef<number>();

  // This function calculates the current display time based on state
  const updateTime = () => {
    if (timer.isRunning) {
      const now = Date.now();
      const currentSessionDuration = now - timer.startTime;
      setDisplayTime(timer.accumulatedTime + currentSessionDuration);
      requestRef.current = requestAnimationFrame(updateTime);
    } else {
      setDisplayTime(timer.accumulatedTime);
    }
  };

  useEffect(() => {
    if (timer.isRunning) {
      requestRef.current = requestAnimationFrame(updateTime);
    } else {
      // If not running, ensure we show the static accumulated time
      setDisplayTime(timer.accumulatedTime);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isRunning, timer.startTime, timer.accumulatedTime]);

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border transition-all duration-300
      ${timer.isRunning 
        ? 'bg-slate-900 border-indigo-500/50 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]' 
        : 'bg-slate-800 border-slate-700'
      }
      p-6
    `}>
      {/* Background Pulse Effect when running */}
      {timer.isRunning && (
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full animate-pulse" />
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Info Section */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${timer.isRunning ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-wide">{timer.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${timer.isRunning ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {timer.isRunning ? 'EM ANDAMENTO' : 'PAUSADO'}
            </span>
          </div>
        </div>

        {/* Time Display */}
        <div className={`text-4xl md:text-5xl font-mono font-bold tabular-nums tracking-tighter ${timer.isRunning ? 'text-white' : 'text-slate-400'}`}>
          {formatTime(displayTime)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {timer.isRunning ? (
            <button
              onClick={() => onPause(timer.id)}
              className="p-3 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:scale-105 active:scale-95 transition-all border border-amber-500/20"
              title="Pausar"
            >
              <Pause size={24} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => onResume(timer.id)}
              className="p-3 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:scale-105 active:scale-95 transition-all border border-green-500/20"
              title="Continuar"
            >
              <Play size={24} fill="currentColor" />
            </button>
          )}

          <button
            onClick={() => onStop(timer.id)}
            className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-105 active:scale-95 transition-all border border-red-500/20"
            title="Finalizar e Salvar"
          >
            <Square size={24} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveTimer;
