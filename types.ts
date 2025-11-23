export interface TimerState {
  id: string;
  name: string;
  startTime: number; // Timestamp of when the current interval started (if running)
  accumulatedTime: number; // Total ms accumulated before the current interval
  isRunning: boolean;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  name: string;
  duration: number;
  finishedAt: number;
}
