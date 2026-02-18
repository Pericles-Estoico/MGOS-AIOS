import { describe, it, expect } from 'vitest';
import { secondsToMinutes, formatSecondsToMMSS, isValidDuration } from '@/utils/time-utils';

/**
 * Story 2.2 - Timer Utility Functions Tests
 */

describe('time-utils', () => {
  describe('secondsToMinutes - AC-2.2.7: Time rounding', () => {
    it('should return 0 for 0 seconds', () => {
      expect(secondsToMinutes(0)).toBe(0);
    });

    it('should round up 30 seconds to 1 minute', () => {
      expect(secondsToMinutes(30)).toBe(1);
    });

    it('should round up 61 seconds to 2 minutes', () => {
      expect(secondsToMinutes(61)).toBe(2);
    });

    it('should keep 60 seconds as 1 minute', () => {
      expect(secondsToMinutes(60)).toBe(1);
    });

    it('should handle large values (3599s → 60m)', () => {
      expect(secondsToMinutes(3599)).toBe(60);
    });

    it('should always round up (never down)', () => {
      expect(secondsToMinutes(1)).toBe(1);
      expect(secondsToMinutes(59)).toBe(1);
      expect(secondsToMinutes(121)).toBe(3);
    });
  });

  describe('formatSecondsToMMSS - AC-2.2.2: MM:SS format', () => {
    it('should format 0 seconds as 00:00', () => {
      expect(formatSecondsToMMSS(0)).toBe('00:00');
    });

    it('should format 30 seconds as 00:30', () => {
      expect(formatSecondsToMMSS(30)).toBe('00:30');
    });

    it('should format 90 seconds as 01:30', () => {
      expect(formatSecondsToMMSS(90)).toBe('01:30');
    });

    it('should format 60 seconds as 01:00', () => {
      expect(formatSecondsToMMSS(60)).toBe('01:00');
    });

    it('should zero-pad minutes and seconds', () => {
      const result = formatSecondsToMMSS(125);
      const [minutes, seconds] = result.split(':');
      
      expect(minutes).toMatch(/^\d{2}$/);
      expect(seconds).toMatch(/^\d{2}$/);
    });

    it('should support up to 99:59', () => {
      expect(formatSecondsToMMSS(5999)).toBe('99:59');
    });

    it('should handle edge case 3599 seconds (59:59)', () => {
      expect(formatSecondsToMMSS(3599)).toBe('59:59');
    });
  });

  describe('isValidDuration - AC-2.2.7: Duration validation', () => {
    it('should reject 0 minutes', () => {
      expect(isValidDuration(0)).toBe(false);
    });

    it('should accept 1 minute (minimum)', () => {
      expect(isValidDuration(1)).toBe(true);
    });

    it('should accept 30 minutes', () => {
      expect(isValidDuration(30)).toBe(true);
    });

    it('should accept 1440 minutes (maximum - 24 hours)', () => {
      expect(isValidDuration(1440)).toBe(true);
    });

    it('should reject 1441 minutes (over maximum)', () => {
      expect(isValidDuration(1441)).toBe(false);
    });

    it('should reject negative values', () => {
      expect(isValidDuration(-1)).toBe(false);
    });
  });
});
