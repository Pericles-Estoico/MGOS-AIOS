'use client';

import { useEffect, useState } from 'react';

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
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
          isRunning
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {isRunning ? '⏱️ Running' : '⏸️ Paused'}
        </span>
      </div>

      {/* Timer Display - Large and prominent */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 w-full max-w-sm">
        <div
          className="text-8xl font-bold font-mono text-center text-blue-900 tracking-wider"
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
          className={`px-6 py-3 rounded-lg text-white font-semibold transition transform hover:scale-105 active:scale-95 ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>

        <button
          onClick={handleStop}
          aria-label="Stop timer and log time"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
        >
          ✓ Stop & Log
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset timer to zero"
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition transform hover:scale-105 active:scale-95"
        >
          ↻ Reset
        </button>
      </div>
    </div>
  );
}
