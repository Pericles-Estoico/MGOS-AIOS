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
      {/* Timer Display */}
      <div className="text-6xl font-bold font-mono text-gray-900">
        {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handleToggle}
          className={`px-6 py-2 rounded-lg text-white font-medium transition ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>

        <button
          onClick={handleStop}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          ✓ Stop & Log
        </button>

        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
        >
          ↻ Reset
        </button>
      </div>

      {/* Duration info */}
      <div className="text-center text-gray-600">
        <p className="text-sm">
          {minutes} min {remainingSeconds} sec
        </p>
        <p className="text-xs mt-1">≈ {Math.round((seconds / 60) * 10) / 10} minutes</p>
      </div>
    </div>
  );
}
