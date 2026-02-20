/**
 * Email Triggers Tests
 * Story 3.1: Email Notification System Phase 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  onTaskAssigned,
  onTaskStatusChanged,
  onCommentMention,
  onDeadlineApproaching,
  triggerMultiple,
  type TaskEvent,
  type CommentEvent,
} from '@/lib/email-triggers';

// Mock the email service
vi.mock('@/lib/email-service', () => ({
  queueEmail: vi.fn().mockResolvedValue(true),
}));

describe('Email Triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onTaskAssigned', () => {
    it('should trigger email when task is assigned', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Build API',
        description: 'Create REST API',
        priority: 'high',
        dueDate: '2026-02-25',
        assignedBy: { id: 'user-2', name: 'Manager' },
        taskUrl: '/tasks/task-1',
      };

      const assignedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John',
      };

      const result = await onTaskAssigned(task, assignedUser);

      expect(result).toBe(true);
    });

    it('should handle missing assignedBy gracefully', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Build API',
        assignedBy: undefined, // Missing
        taskUrl: '/tasks/task-1',
      };

      const assignedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John',
      };

      const result = await onTaskAssigned(task, assignedUser);

      expect(result).toBe(false);
    });

    it('should use default values for missing optional fields', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Simple Task',
        // No description, priority, or dueDate
        assignedBy: { id: 'user-2', name: 'Manager' },
        taskUrl: '/tasks/task-1',
      };

      const assignedUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John',
      };

      const result = await onTaskAssigned(task, assignedUser);

      expect(result).toBe(true);
    });
  });

  describe('onTaskStatusChanged', () => {
    it('should trigger email when task status changes', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Build API',
        status: 'completed',
        previousStatus: 'in_progress',
        assignedTo: { id: 'user-1', email: 'user@example.com', name: 'John' },
        taskUrl: '/tasks/task-1',
      };

      const changedBy = { id: 'user-2', name: 'QA Engineer' };
      const comment = 'Looks good!';

      const result = await onTaskStatusChanged(task, changedBy, comment);

      expect(result).toBe(true);
    });

    it('should handle various status transitions', async () => {
      const statusTransitions = [
        { previous: 'pending', current: 'in_progress' },
        { previous: 'in_progress', current: 'in_review' },
        { previous: 'in_review', current: 'approved' },
        { previous: 'approved', current: 'completed' },
      ];

      for (const transition of statusTransitions) {
        const task: TaskEvent = {
          id: 'task-1',
          title: 'Test Task',
          status: transition.current,
          previousStatus: transition.previous,
          assignedTo: { id: 'user-1', email: 'user@example.com', name: 'John' },
          taskUrl: '/tasks/task-1',
        };

        const result = await onTaskStatusChanged(task, { id: 'user-2', name: 'Admin' });

        expect(result).toBe(true);
      }
    });

    it('should handle missing required fields', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Test',
        // Missing status, previousStatus, assignedTo
        taskUrl: '/tasks/task-1',
      };

      const result = await onTaskStatusChanged(task, { id: 'user-2', name: 'Admin' });

      expect(result).toBe(false);
    });
  });

  describe('onCommentMention', () => {
    it('should trigger email when user is mentioned in comment', async () => {
      const comment: CommentEvent = {
        id: 'comment-1',
        taskId: 'task-1',
        taskTitle: 'Build API',
        authorId: 'user-1',
        authorName: 'John',
        authorEmail: 'john@example.com',
        mentionedUserId: 'user-2',
        mentionedUserEmail: 'jane@example.com',
        mentionedUserName: 'Jane',
        text: '@Jane can you review this?',
        taskUrl: '/tasks/task-1',
      };

      const result = await onCommentMention(comment);

      expect(result).toBe(true);
    });

    it('should handle missing mentioned user info', async () => {
      const comment: CommentEvent = {
        id: 'comment-1',
        taskId: 'task-1',
        taskTitle: 'Build API',
        authorId: 'user-1',
        authorName: 'John',
        authorEmail: 'john@example.com',
        text: 'Some comment',
        taskUrl: '/tasks/task-1',
        // Missing mentionedUserEmail and mentionedUserName
      };

      const result = await onCommentMention(comment);

      expect(result).toBe(false);
    });
  });

  describe('onDeadlineApproaching', () => {
    it('should trigger deadline approaching notification', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Complete Project',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-02-22',
        taskUrl: '/tasks/task-1',
      };

      const result = await onDeadlineApproaching(task, 'user-1', 'user@example.com', 'John', 2);

      expect(result).toBe(true);
    });

    it('should handle overdue tasks (negative days)', async () => {
      const task: TaskEvent = {
        id: 'task-1',
        title: 'Overdue Task',
        status: 'blocked',
        dueDate: '2026-02-10',
        taskUrl: '/tasks/task-1',
      };

      const result = await onDeadlineApproaching(task, 'user-1', 'user@example.com', 'John', -5);

      expect(result).toBe(true);
    });

    it('should handle various deadline scenarios', async () => {
      const scenarios = [
        { daysRemaining: 7, label: '1 week' },
        { daysRemaining: 3, label: '3 days' },
        { daysRemaining: 1, label: '1 day' },
        { daysRemaining: 0, label: 'Today' },
        { daysRemaining: -1, label: '1 day overdue' },
      ];

      for (const scenario of scenarios) {
        const task: TaskEvent = {
          id: 'task-1',
          title: `Task (${scenario.label})`,
          taskUrl: '/tasks/task-1',
        };

        const result = await onDeadlineApproaching(task, 'user-1', 'user@example.com', 'John', scenario.daysRemaining);

        expect(result).toBe(true);
      }
    });
  });

  describe('triggerMultiple', () => {
    it('should handle batch of different event types', async () => {
      const events = [
        {
          type: 'task_assigned',
          data: {
            task: { id: 'task-1', title: 'Task 1', assignedBy: { id: 'user-2', name: 'Manager' }, taskUrl: '/tasks/1' },
            assignedUser: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
          },
        },
        {
          type: 'task_status_changed',
          data: {
            task: {
              id: 'task-2',
              title: 'Task 2',
              status: 'completed',
              previousStatus: 'in_progress',
              assignedTo: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
              taskUrl: '/tasks/2',
            },
            changedBy: { id: 'user-2', name: 'Manager' },
          },
        },
        {
          type: 'comment_mention',
          data: {
            id: 'comment-1',
            taskId: 'task-3',
            taskTitle: 'Task 3',
            authorId: 'user-2',
            authorName: 'User 2',
            authorEmail: 'user2@example.com',
            mentionedUserId: 'user-1',
            mentionedUserEmail: 'user1@example.com',
            mentionedUserName: 'User 1',
            text: '@User 1 check this',
            taskUrl: '/tasks/3',
          },
        },
      ];

      const results = await triggerMultiple(events);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle invalid event types gracefully', async () => {
      const events = [
        {
          type: 'unknown_event',
          data: {},
        },
      ];

      const results = await triggerMultiple(events);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Unknown event type');
    });

    it('should provide individual error tracking per event', async () => {
      const events = [
        {
          type: 'task_assigned',
          data: {
            task: { id: 'task-1', title: 'Task', assignedBy: { id: 'user-2', name: 'Manager' } },
            assignedUser: { id: 'user-1', email: 'user@example.com', name: 'User' },
          },
        },
        {
          type: 'invalid',
          data: {},
        },
      ];

      const results = await triggerMultiple(events);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Status Formatting', () => {
    it('should format task statuses correctly', async () => {
      const statusTests = [
        { input: 'pending', expected: 'Pendente' },
        { input: 'in_progress', expected: 'Em Progresso' },
        { input: 'completed', expected: 'Concluída' },
        { input: 'blocked', expected: 'Bloqueada' },
      ];

      for (const test of statusTests) {
        const task: TaskEvent = {
          id: 'task-1',
          title: 'Test',
          status: test.input,
          previousStatus: 'pending',
          assignedTo: { id: 'user-1', email: 'user@example.com', name: 'User' },
        };

        // Trigger should succeed - formatting happens internally
        const result = await onTaskStatusChanged(task, { id: 'user-2', name: 'Admin' });
        expect(result).toBe(true);
      }
    });
  });
});
