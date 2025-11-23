import React, { useState, useEffect } from 'react';
import { Plus, History, Trash2, StopCircle, Clock } from 'lucide-react';
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
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-6">
            {/* Logo Container */}
            <div className="h-24 w-auto overflow-hidden rounded-xl bg-slate-200 border border-slate-700 flex items-center justify-center p-2 shadow-lg">
               <img 
                 src="/logo.png" 
                 alt="Mialu Crochê Logo" 
                 className="h-full w-auto object-contain"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.onerror = null; // Prevent infinite loop
                   // Fallback placeholder with matching colors if logo.png is missing
                   target.src = "https://placehold.co/400x160/f1f5f9/1e3a8a?text=MIALU+CROCH%C3%8A&font=playfair-display";
                 }}
               />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Mialu ChronoTrack Pro</h1>
              <p className="text-indigo-400 text-sm font-medium mt-1">Contador de tempo para Crochê</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 text-sm font-medium text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-slate-300">{activeTimers.filter(t => t.isRunning).length}</span> Ativos
            </div>
            <div className="flex items-center gap-2">
               <Clock size={14} className="text-slate-500"/>
               <span className="text-slate-300">{activeTimers.length}</span> Total
            </div>
          </div>
        </header>

        {/* Create New Timer */}
        <section className="bg-slate-900/50 rounded-2xl p-1 border border-slate-800 shadow-xl shadow-black/20">
          <form onSubmit={startNewTimer} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do projeto de crochê (ex: Tapete Sala)..."
              className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 px-4 py-3 outline-none"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:translate-y-0.5"
            >
              <Plus size={20} />
              Iniciar Projeto
            </button>
          </form>
        </section>

        {/* Active Timers List */}
        <section className="space-y-4">
          {activeTimers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <div className="bg-indigo-600/20 p-3 rounded-full">
                  <Plus className="text-indigo-500" size={32} />
                </div>
              </div>
              <h3 className="text-slate-300 font-medium text-lg">Nenhum projeto em andamento</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Digite o nome do seu projeto de crochê acima e clique em iniciar para começar a contagem.</p>
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
        <section className="pt-8 border-t border-slate-800/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="text-indigo-400" />
              Histórico de Projetos
              <span className="text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                Últimos 10
              </span>
            </h2>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
              >
                <Trash2 size={14} />
                Limpar Histórico
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {history.length === 0 ? (
              <div className="text-slate-600 text-sm italic py-8 text-center bg-slate-900/30 rounded-xl border border-slate-800/50">
                Os projetos finalizados aparecerão aqui.
              </div>
            ) : (
              history.map((entry) => (
                <div 
                  key={entry.id + entry.finishedAt} 
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></div>
                  
                  <div className="flex flex-col mb-2 sm:mb-0 pl-2">
                    <span className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors text-lg">
                      {entry.name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      Finalizado em {formatDate(entry.finishedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 bg-slate-950/50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                    <span className="text-xs text-slate-500 sm:hidden uppercase font-bold tracking-wider">Tempo Total</span>
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-xl text-indigo-100 font-bold tracking-tight">
                        {formatTime(entry.duration)}
                      </div>
                      <StopCircle size={20} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                    </div>
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