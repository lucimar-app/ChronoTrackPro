import React, { useState, useEffect } from 'react';
import { Plus, History, Trash2, Timer, StopCircle } from 'lucide-react';
import { TimerState, HistoryEntry } from './types';
import ActiveTimer from './components/ActiveTimer';
import { formatDate, formatTime } from './utils/format';

const App: React.FC = () => {
  // --- State ---
  const [activeTimers, setActiveTimers] = useState<TimerState[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newName, setNewName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // --- Persistence ---
  
  // Load data on mount
  useEffect(() => {
    try {
      const storedTimers = localStorage.getItem('chrono_active_timers');
      const storedHistory = localStorage.getItem('chrono_history');

      if (storedTimers) {
        setActiveTimers(JSON.parse(storedTimers));
      }
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Error loading data from cookies/storage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save data whenever it changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('chrono_active_timers', JSON.stringify(activeTimers));
  }, [activeTimers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('chrono_history', JSON.stringify(history));
  }, [history, isLoaded]);

  // --- Actions ---

  const startNewTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newTimer: TimerState = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      startTime: Date.now(),
      accumulatedTime: 0,
      isRunning: true,
      createdAt: Date.now(),
    };

    setActiveTimers(prev => [newTimer, ...prev]);
    setNewName('');
  };

  const pauseTimer = (id: string) => {
    setActiveTimers(prev => prev.map(timer => {
      if (timer.id !== id || !timer.isRunning) return timer;
      
      const now = Date.now();
      return {
        ...timer,
        isRunning: false,
        accumulatedTime: timer.accumulatedTime + (now - timer.startTime),
      };
    }));
  };

  const resumeTimer = (id: string) => {
    setActiveTimers(prev => prev.map(timer => {
      if (timer.id !== id || timer.isRunning) return timer;

      return {
        ...timer,
        isRunning: true,
        startTime: Date.now(),
      };
    }));
  };

  const stopAndSaveTimer = (id: string) => {
    const timer = activeTimers.find(t => t.id === id);
    if (!timer) return;

    // Calculate final duration
    let finalDuration = timer.accumulatedTime;
    if (timer.isRunning) {
      finalDuration += (Date.now() - timer.startTime);
    }

    const historyEntry: HistoryEntry = {
      id: timer.id,
      name: timer.name,
      duration: finalDuration,
      finishedAt: Date.now(),
    };

    // Add to history (keep only last 10)
    setHistory(prev => {
      const newHistory = [historyEntry, ...prev];
      return newHistory.slice(0, 10);
    });

    // Remove from active
    setActiveTimers(prev => prev.filter(t => t.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar o histórico?')) {
      setHistory([]);
    }
  };

  // --- Render ---

  if (!isLoaded) return null; // Prevent hydration mismatch or flash

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20">
              <Timer className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ChronoTrack Pro</h1>
              <p className="text-slate-500 text-sm">Gerenciador de Múltiplos Cronômetros</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               {activeTimers.filter(t => t.isRunning).length} Ativos
            </div>
            <div className="w-px h-4 bg-slate-700"></div>
            <div>{activeTimers.length} Total</div>
          </div>
        </header>

        {/* Create New Timer */}
        <section className="bg-slate-900/50 rounded-2xl p-1 border border-slate-800">
          <form onSubmit={startNewTimer} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Dê um nome ao seu novo cronômetro..."
              className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 px-4 py-3 outline-none"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:translate-y-0.5"
            >
              <Plus size={20} />
              Iniciar
            </button>
          </form>
        </section>

        {/* Active Timers List */}
        <section className="space-y-4">
          {activeTimers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Timer size={32} />
              </div>
              <h3 className="text-slate-400 font-medium">Nenhum cronômetro ativo</h3>
              <p className="text-slate-600 text-sm mt-1">Digite um nome acima para começar.</p>
            </div>
          ) : (
            activeTimers.map(timer => (
              <ActiveTimer
                key={timer.id}
                timer={timer}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onStop={stopAndSaveTimer}
              />
            ))
          )}
        </section>

        {/* History Section */}
        <section className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="text-slate-500" />
              Histórico Recente
              <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                Últimos 10
              </span>
            </h2>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Limpar
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {history.length === 0 ? (
              <div className="text-slate-600 text-sm italic py-4">
                Nenhum histórico gravado ainda. Finalize um cronômetro para vê-lo aqui.
              </div>
            ) : (
              history.map((entry) => (
                <div 
                  key={entry.id + entry.finishedAt} 
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl p-4 flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {entry.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(entry.finishedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-xl text-slate-300">
                      {formatTime(entry.duration)}
                    </div>
                    <StopCircle size={20} className="text-slate-700" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
