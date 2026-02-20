/**
 * User Preferences Helper Functions Tests
 * Story 3.2: User Management System Phase 2
 */

import {
  validatePreferences,
  validateTimeFormat,
  getSupportedTimezones,
  UserPreferences,
  PreferenceUpdate,
} from '@/lib/user-preferences';

describe('User Preferences Helper Functions', () => {
  const mockUserId = 'test-user-123';
  const mockTimezone = 'America/New_York';

  describe('validatePreferences', () => {
    it('should validate correct time format', () => {
      const validUpdates: PreferenceUpdate = {
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: mockTimezone,
      };

      const errors = validatePreferences(validUpdates);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid quietHoursStart format', () => {
      const invalidUpdates: PreferenceUpdate = {
        quietHoursStart: '25:00',
      };

      const errors = validatePreferences(invalidUpdates);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('Invalid time format');
    });

    it('should reject invalid quietHoursEnd format', () => {
      const invalidUpdates: PreferenceUpdate = {
        quietHoursEnd: '8:60',
      };

      const errors = validatePreferences(invalidUpdates);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject equal start and end times', () => {
      const invalidUpdates: PreferenceUpdate = {
        quietHoursStart: '22:00',
        quietHoursEnd: '22:00',
      };

      const errors = validatePreferences(invalidUpdates);
      expect(errors.some((e) => e.includes('cannot be the same'))).toBe(true);
    });

    it('should reject invalid timezone', () => {
      const invalidUpdates: PreferenceUpdate = {
        timezone: 'Invalid/Timezone',
      };

      const errors = validatePreferences(invalidUpdates);
      expect(errors.some((e) => e.includes('Invalid timezone'))).toBe(true);
    });

    it('should accept all valid preference types', () => {
      const validUpdates: PreferenceUpdate = {
        taskAssigned: true,
        statusChanged: false,
        commentMention: true,
        deadlineApproaching: false,
        dailyDigest: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
        timezone: 'Europe/London',
      };

      const errors = validatePreferences(validUpdates);
      expect(errors).toHaveLength(0);
    });

    it('should handle partial updates', () => {
      const partialUpdates: PreferenceUpdate = {
        taskAssigned: false,
      };

      const errors = validatePreferences(partialUpdates);
      expect(errors).toHaveLength(0);
    });

    it('should validate quiet hours across midnight', () => {
      const updates: PreferenceUpdate = {
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      };

      const errors = validatePreferences(updates);
      expect(errors).toHaveLength(0);
    });
  });

  describe('getSupportedTimezones', () => {
    it('should return a list of timezones', () => {
      const timezones = getSupportedTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should include common timezones', () => {
      const timezones = getSupportedTimezones();
      expect(timezones).toContain('UTC');
      expect(timezones).toContain('America/New_York');
      expect(timezones).toContain('Europe/London');
      expect(timezones).toContain('Asia/Tokyo');
      expect(timezones).toContain('Australia/Sydney');
    });

    it('should include Brazilian timezone', () => {
      const timezones = getSupportedTimezones();
      expect(timezones).toContain('America/Sao_Paulo');
    });

    it('should not contain duplicates', () => {
      const timezones = getSupportedTimezones();
      const uniqueTimezones = new Set(timezones);
      expect(uniqueTimezones.size).toBe(timezones.length);
    });
  });

  describe('Time Format Validation', () => {
    it('should validate valid time formats', () => {
      const validTimes = ['00:00', '12:30', '23:59', '08:15', '18:45'];
      validTimes.forEach((time) => {
        expect(() => validateTimeFormat(time)).not.toThrow();
      });
    });

    it('should reject invalid time formats', () => {
      const invalidTimes = ['25:00', '12:60', '8:30', '12:30:00', '12-30', 'invalid', '24:00'];
      invalidTimes.forEach((time) => {
        expect(() => validateTimeFormat(time)).toThrow();
      });
    });

    it('should handle hour boundary values', () => {
      expect(() => validateTimeFormat('00:00')).not.toThrow();
      expect(() => validateTimeFormat('23:59')).not.toThrow();
    });
  });

  describe('Preference Type Definitions', () => {
    it('should have correct UserPreferences structure', () => {
      const mockPrefs: UserPreferences = {
        id: '123',
        userId: mockUserId,
        taskAssigned: true,
        statusChanged: true,
        commentMention: true,
        deadlineApproaching: true,
        dailyDigest: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: mockTimezone,
        lastModifiedAt: new Date().toISOString(),
        isActive: true,
      };

      expect(mockPrefs.userId).toBe(mockUserId);
      expect(mockPrefs.timezone).toBe(mockTimezone);
      expect(mockPrefs.isActive).toBe(true);
    });

    it('should have correct PreferenceUpdate structure', () => {
      const updates: PreferenceUpdate = {
        taskAssigned: false,
        quietHoursStart: '23:00',
      };

      expect(updates.taskAssigned).toBe(false);
      expect(updates.quietHoursStart).toBe('23:00');
      expect(updates.timezone).toBeUndefined();
    });
  });

  describe('Default Preferences', () => {
    it('should have correct default values', () => {
      const defaults: PreferenceUpdate = {
        taskAssigned: true,
        statusChanged: true,
        commentMention: true,
        deadlineApproaching: true,
        dailyDigest: false,
        timezone: 'UTC',
      };

      const errors = validatePreferences(defaults);
      expect(errors).toHaveLength(0);
    });

    it('should validate multiple preference combinations', () => {
      const scenarios = [
        { taskAssigned: true },
        { dailyDigest: false },
        { timezone: 'America/Chicago' },
        { quietHoursStart: '09:00', quietHoursEnd: '17:00' },
        { taskAssigned: true, dailyDigest: true, timezone: 'Asia/Tokyo' },
      ];

      scenarios.forEach((scenario) => {
        const errors = validatePreferences(scenario);
        expect(errors).toHaveLength(0);
      });
    });
  });
});
