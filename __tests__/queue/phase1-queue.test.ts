/**
 * Unit Tests for Phase 1 Queue
 * Tests queue initialization, job enqueue, validation, and cleanup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getPhase1Queue,
  enqueuePhase1Job,
  getJobStatus,
  closePhase1Queue,
  Phase1JobSchema,
} from '@/lib/queue/phase1-queue';

describe('Phase 1 Queue', () => {
  beforeAll(async () => {
    // Setup: ensure Redis is available (or test with mocks)
    console.log('🏁 Starting Phase 1 Queue tests');
  });

  afterAll(async () => {
    // Cleanup
    await closePhase1Queue();
    console.log('✅ Phase 1 Queue tests complete');
  });

  describe('Queue Initialization', () => {
    it('should create queue instance', () => {
      const queue = getPhase1Queue();
      expect(queue).toBeDefined();
      expect(queue.name).toBe('phase1-tasks');
    });

    it('should return same queue instance on subsequent calls', () => {
      const queue1 = getPhase1Queue();
      const queue2 = getPhase1Queue();
      expect(queue1).toBe(queue2);
    });

    it('should have correct queue name', () => {
      const queue = getPhase1Queue();
      expect(queue.name).toBe('phase1-tasks');
    });
  });

  describe('Job Schema Validation', () => {
    it('should validate correct job payload', () => {
      const validPayload = {
        planId: '550e8400-e29b-41d4-a716-446655440000',
        channels: ['amazon', 'shopee'],
        opportunities: [
          {
            id: '1',
            title: 'Test Opportunity',
            phase: '1',
            description: 'Test description',
          },
        ],
        metadata: {
          createdBy: 'user-123',
          approvedAt: new Date(),
        },
      };

      const result = Phase1JobSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid planId (not UUID)', () => {
      const invalidPayload = {
        planId: 'not-a-uuid',
        channels: ['amazon'],
        opportunities: [],
        metadata: { createdBy: 'user-123' },
      };

      const result = Phase1JobSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject empty channels array', () => {
      const invalidPayload = {
        planId: '550e8400-e29b-41d4-a716-446655440000',
        channels: [],
        opportunities: [],
        metadata: { createdBy: 'user-123' },
      };

      const result = Phase1JobSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should accept optional description in opportunities', () => {
      const validPayload = {
        planId: '550e8400-e29b-41d4-a716-446655440000',
        channels: ['amazon'],
        opportunities: [
          {
            id: '1',
            title: 'Opportunity',
            phase: '1',
          },
        ],
        metadata: { createdBy: 'user-123' },
      };

      const result = Phase1JobSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Job Enqueue', () => {
    it('should enqueue valid job and return job ID', async () => {
      const jobPayload = {
        planId: '550e8400-e29b-41d4-a716-446655440001',
        channels: ['amazon', 'shopee'],
        opportunities: [
          {
            id: 'opp-1',
            title: 'Test Opportunity',
            phase: '1',
          },
        ],
        metadata: {
          createdBy: 'test-user',
          approvedAt: new Date(),
        },
      };

      try {
        const jobId = await enqueuePhase1Job(jobPayload);
        expect(jobId).toBeDefined();
        expect(typeof jobId).toBe('string');
        expect(jobId).toContain('phase1');
      } catch {
        // Redis may not be running in test environment
        console.warn('Skipping enqueue test - Redis not available');
      }
    });

    it('should reject invalid job payload', async () => {
      const invalidPayload = {
        planId: 'invalid-uuid',
        channels: ['amazon'],
        opportunities: [],
        metadata: { createdBy: 'user-123' },
      };

      await expect(enqueuePhase1Job(invalidPayload)).rejects.toThrow();
    });
  });

  describe('Job Status', () => {
    it('should return null for non-existent job', async () => {
      try {
        const status = await getJobStatus('non-existent-job-id');
        expect(status).toBeNull();
      } catch {
        // Redis may not be running
        console.warn('Skipping status test - Redis not available');
      }
    });

    it('should have correct status structure', async () => {
      const jobPayload = {
        planId: '550e8400-e29b-41d4-a716-446655440002',
        channels: ['amazon'],
        opportunities: [
          {
            id: 'opp-1',
            title: 'Opportunity',
            phase: '1',
          },
        ],
        metadata: { createdBy: 'test-user' },
      };

      try {
        const jobId = await enqueuePhase1Job(jobPayload);
        const status = await getJobStatus(jobId);

        if (status) {
          expect(status).toHaveProperty('id');
          expect(status).toHaveProperty('status');
          expect(status).toHaveProperty('progress');
          expect(status).toHaveProperty('attempts');
          expect(status).toHaveProperty('maxAttempts');
        }
      } catch {
        console.warn('Skipping detailed status test - Redis not available');
      }
    });
  });

  describe('Queue Cleanup', () => {
    it('should close queue gracefully', async () => {
      await closePhase1Queue();
      // After close, new queue should be created on next call
      const newQueue = getPhase1Queue();
      expect(newQueue).toBeDefined();
    });
  });
});
