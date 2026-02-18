/**
 * Time Utility Functions
 * Story 2.2: Timer Tracking
 */

/**
 * Convert seconds to minutes, rounding up
 * Used for time logging from timer
 *
 * @param seconds - Number of seconds
 * @returns Minutes rounded up (Math.ceil)
 *
 * @example
 * secondsToMinutes(0)   // = 0
 * secondsToMinutes(30)  // = 1 (rounded up)
 * secondsToMinutes(60)  // = 1
 * secondsToMinutes(61)  // = 2 (rounded up)
 * secondsToMinutes(3599) // = 60
 */
export function secondsToMinutes(seconds: number): number {
  if (seconds === 0) return 0;
  return Math.ceil(seconds / 60);
}

/**
 * Format seconds into MM:SS display format
 * Used for timer display
 *
 * @param seconds - Number of seconds
 * @returns Formatted string "MM:SS"
 *
 * @example
 * formatSecondsToMMSS(0)    // = "00:00"
 * formatSecondsToMMSS(30)   // = "00:30"
 * formatSecondsToMMSS(90)   // = "01:30"
 * formatSecondsToMMSS(3599) // = "59:59"
 */
export function formatSecondsToMMSS(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(secs).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Validate time duration for logging
 * Ensures duration is within acceptable range
 *
 * @param minutes - Duration in minutes
 * @returns true if valid, false otherwise
 */
export function isValidDuration(minutes: number): boolean {
  return minutes > 0 && minutes <= 1440; // Max 24 hours
}
