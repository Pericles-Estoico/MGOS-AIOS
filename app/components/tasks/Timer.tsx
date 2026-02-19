'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TimerProps {
  initialSeconds?: number;
  onStop?: (durationMinutes: number) => void;
  autoStart?: boolean;
}

export default function Timer({ initialSeconds = 0, onStop, autoStart = false }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop?.(Math.ceil(seconds / 60));
  };

  const handleReset = () => {
    setSeconds(0);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Status indicator */}
      <div className="text-center">
        <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${
          isRunning
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {isRunning ? (
            <>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Running
            </>
          ) : (
            <>
              <Square className="w-3 h-3" />
              Paused
            </>
          )}
        </span>
      </div>

      {/* Timer Display - Large and prominent */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 w-full max-w-sm">
        <div
          className="text-8xl font-bold font-mono text-center text-teal-900 tracking-wider"
          role="timer"
          aria-live="polite"
          aria-label={`${String(minutes).padStart(2, '0')} minutes ${String(remainingSeconds).padStart(2, '0')} seconds`}
        >
          {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
        </div>
      </div>

      {/* Duration breakdown */}
      <div className="text-center text-gray-700 space-y-1">
        <p className="text-lg font-semibold">
          {minutes} min {remainingSeconds} sec
        </p>
        <p className="text-sm text-gray-600">
          ≈ {Math.ceil(seconds / 60)} min (will be logged)
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={handleToggle}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition transform hover:scale-105 active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>

        <button
          onClick={handleStop}
          aria-label="Stop timer and log time"
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
        >
          <Square className="w-4 h-4" />
          Stop & Log
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset timer to zero"
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
