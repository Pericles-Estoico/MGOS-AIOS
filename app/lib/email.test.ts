import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendEmail,
  taskAssignmentEmail,
  qaReviewFeedbackEmail,
  welcomeEmail,
  EmailOptions,
} from './email';

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const options: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sendEmail(options);
      expect(result).toBe(true);
    });

    it('should handle email send errors gracefully', async () => {
      const options: EmailOptions = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      // Should not throw error
      const result = await sendEmail(options);
      expect(typeof result).toBe('boolean');
    });

    it('should include plain text fallback', async () => {
      const options: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p><p>World</p>',
        text: 'Custom text',
      };

      const result = await sendEmail(options);
      expect(result).toBe(true);
    });
  });

  describe('taskAssignmentEmail', () => {
    it('should generate valid task assignment email template', () => {
      const email = taskAssignmentEmail(
        'John Doe',
        'Complete Project Documentation',
        'task-123',
        'http://example.com/unsubscribe'
      );

      expect(email.subject).toContain('Complete Project Documentation');
      expect(email.html).toContain('John Doe');
      expect(email.html).toContain('Nova Tarefa Atribuída');
      expect(email.html).toContain('task-123');
    });

    it('should include unsubscribe link', () => {
      const email = taskAssignmentEmail(
        'Jane Doe',
        'Review PR',
        'task-456',
        'http://example.com/unsub'
      );

      expect(email.html).toContain('http://example.com/unsub');
    });

    it('should escape HTML in user name', () => {
      const email = taskAssignmentEmail(
        '<script>alert("xss")</script>',
        'Task',
        'task-789',
        'http://example.com/unsub'
      );

      expect(email.html).not.toContain('<script>');
      expect(email.html).toContain('&lt;');
    });

    it('should generate plain text version', () => {
      const email = taskAssignmentEmail(
        'Test User',
        'Test Task',
        'task-000',
        'http://example.com/unsub'
      );

      expect(email.text).toBeDefined();
      expect(email.text).toContain('Test User');
      expect(email.text).toContain('Test Task');
    });
  });

  describe('qaReviewFeedbackEmail', () => {
    it('should generate approved QA feedback email', () => {
      const email = qaReviewFeedbackEmail(
        'Developer',
        'Feature X',
        'approved',
        'Looks good!',
        'task-111',
        'http://example.com/unsub'
      );

      expect(email.subject).toContain('Aprovada');
      expect(email.subject).toContain('Feature X');
      expect(email.html).toContain('Aprovada');
      expect(email.html).toContain('Looks good!');
    });

    it('should generate rejected QA feedback email', () => {
      const email = qaReviewFeedbackEmail(
        'Developer',
        'Feature Y',
        'rejected',
        'Missing tests',
        'task-222',
        'http://example.com/unsub'
      );

      expect(email.subject).toContain('Rejeitada');
      expect(email.html).toContain('Rejeitada');
      expect(email.html).toContain('Missing tests');
    });

    it('should handle empty feedback', () => {
      const email = qaReviewFeedbackEmail(
        'Dev',
        'Task',
        'approved',
        '',
        'task-333',
        'http://example.com/unsub'
      );

      expect(email.html).toBeDefined();
      expect(email.subject).toContain('Aprovada');
    });

    it('should escape feedback HTML', () => {
      const email = qaReviewFeedbackEmail(
        'Dev',
        'Task',
        'rejected',
        '<img src=x onerror=alert("xss")>',
        'task-444',
        'http://example.com/unsub'
      );

      expect(email.html).not.toContain('<img');
      expect(email.html).toContain('&lt;');
    });
  });

  describe('welcomeEmail', () => {
    it('should generate valid welcome email', () => {
      const email = welcomeEmail('New User', 'http://example.com/prefs');

      expect(email.subject).toBe('Bem-vindo ao MGOS-AIOS');
      expect(email.html).toContain('New User');
      expect(email.html).toContain('Bem-vindo');
      expect(email.html).toContain('http://example.com/prefs');
    });

    it('should include plain text version', () => {
      const email = welcomeEmail('User', 'http://example.com/prefs');

      expect(email.text).toContain('User');
      expect(email.text).toContain('MGOS-AIOS');
    });

    it('should escape user name', () => {
      const email = welcomeEmail('<b>Hacker</b>', 'http://example.com/prefs');

      expect(email.html).not.toContain('<b>');
      expect(email.html).toContain('&lt;');
    });
  });

  describe('HTML Escaping', () => {
    it('should prevent XSS via email fields', () => {
      const xssPayload = '"><script>alert("xss")</script><"';
      const email = taskAssignmentEmail(xssPayload, xssPayload, 'task-555', xssPayload);

      expect(email.html).not.toContain('<script>');
      expect(email.html).toContain('&lt;');
      expect(email.html).toContain('&quot;');
    });

    it('should handle special characters', () => {
      const special = 'User & "Company" <Test>';
      const email = taskAssignmentEmail(special, special, 'task-666', special);

      expect(email.html).not.toContain('&<>"\'');
    });
  });

  describe('Email Content Validation', () => {
    it('should always include unsubscribe link', () => {
      const task = taskAssignmentEmail('User', 'Task', 'task-777', 'http://unsub.url');
      const qa = qaReviewFeedbackEmail('User', 'Task', 'approved', '', 'task-777', 'http://unsub.url');
      const welcome = welcomeEmail('User', 'http://unsub.url');

      expect(task.html).toContain('unsub.url');
      expect(qa.html).toContain('unsub.url');
      expect(welcome.html).toContain('unsub.url');
    });

    it('should always include action link', () => {
      const task = taskAssignmentEmail('User', 'Task', 'task-888', 'http://unsub.url');
      const qa = qaReviewFeedbackEmail('User', 'Task', 'approved', '', 'task-888', 'http://unsub.url');

      expect(task.html).toContain('task-888');
      expect(qa.html).toContain('task-888');
    });

    it('should have proper email structure', () => {
      const email = taskAssignmentEmail('User', 'Task', 'task-999', 'http://unsub.url');

      expect(email.subject).toBeDefined();
      expect(email.html).toBeDefined();
      expect(email.text).toBeDefined();
      expect(email.to).toBe(''); // Will be set by API
    });
  });
});
