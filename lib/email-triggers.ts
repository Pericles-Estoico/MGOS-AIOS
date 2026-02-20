/**
 * Email Notification Triggers
 * Story 3.1: Email Notification System Phase 1
 *
 * Hooks to trigger email notifications on task events
 */

import { queueEmail } from './email-service';

export interface TaskEvent {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: {
    id: string;
    email: string;
    name: string;
  };
  assignedBy?: {
    id: string;
    name: string;
  };
  previousStatus?: string;
  taskUrl?: string;
}

export interface CommentEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  mentionedUserId?: string;
  mentionedUserEmail?: string;
  mentionedUserName?: string;
  text: string;
  taskUrl?: string;
}

/**
 * Trigger when task is assigned to a user
 */
export async function onTaskAssigned(task: TaskEvent, assignedUser: { id: string; email: string; name: string }): Promise<boolean> {
  if (!task.assignedBy?.name) {
    console.warn('Missing assignedBy info for task assignment notification');
    return false;
  }

  return await queueEmail({
    userId: assignedUser.id,
    recipientEmail: assignedUser.email,
    subject: `Tarefa Atribuída: ${task.title}`,
    templateName: 'task_assigned',
    templateData: {
      userName: assignedUser.name,
      taskTitle: task.title,
      taskDescription: task.description || 'Sem descrição',
      priority: task.priority || 'Média',
      priorityClass: (task.priority || 'medium').toLowerCase(),
      dueDate: task.dueDate || 'Sem prazo definido',
      assignedBy: task.assignedBy.name,
      taskUrl: task.taskUrl || `/tasks/${task.id}`,
      preferencesUrl: '/settings/notifications',
    },
  });
}

/**
 * Trigger when task status changes
 */
export async function onTaskStatusChanged(
  task: TaskEvent,
  changedBy: { id: string; name: string },
  comment?: string
): Promise<boolean> {
  if (!task.assignedTo?.email || !task.previousStatus || !task.status) {
    console.warn('Missing required info for task status change notification');
    return false;
  }

  return await queueEmail({
    userId: task.assignedTo.id,
    recipientEmail: task.assignedTo.email,
    subject: `Status Alterado: ${task.title}`,
    templateName: 'status_changed',
    templateData: {
      userName: task.assignedTo.name,
      taskTitle: task.title,
      oldStatus: formatStatus(task.previousStatus),
      newStatus: formatStatus(task.status),
      changedBy: changedBy.name,
      changedAt: new Date().toLocaleString('pt-BR'),
      comment: comment || '',
      taskUrl: task.taskUrl || `/tasks/${task.id}`,
      preferencesUrl: '/settings/notifications',
    },
  });
}

/**
 * Trigger when user is mentioned in a comment
 */
export async function onCommentMention(comment: CommentEvent): Promise<boolean> {
  if (!comment.mentionedUserEmail || !comment.mentionedUserName) {
    console.warn('Missing mentioned user info for comment mention notification');
    return false;
  }

  return await queueEmail({
    userId: comment.mentionedUserId || 'unknown',
    recipientEmail: comment.mentionedUserEmail,
    subject: `Você foi mencionado: ${comment.taskTitle}`,
    templateName: 'comment_mention',
    templateData: {
      userName: comment.mentionedUserName,
      taskTitle: comment.taskTitle,
      authorName: comment.authorName,
      commentText: comment.text,
      commentDate: new Date().toLocaleString('pt-BR'),
      taskUrl: comment.taskUrl || `/tasks/${comment.taskId}`,
      preferencesUrl: '/settings/notifications',
    },
  });
}

/**
 * Trigger deadline approaching notification
 * (typically called by scheduled job)
 */
export async function onDeadlineApproaching(
  task: TaskEvent,
  userId: string,
  userEmail: string,
  userName: string,
  daysRemaining: number
): Promise<boolean> {
  const isOverdue = daysRemaining < 0;

  return await queueEmail({
    userId,
    recipientEmail: userEmail,
    subject: `Lembrete: ${task.title} vence em ${task.dueDate}`,
    templateName: 'deadline_approaching',
    templateData: {
      userName,
      taskTitle: task.title,
      taskStatus: task.status || 'Em progresso',
      priority: task.priority || 'Média',
      dueDate: task.dueDate || 'Sem prazo',
      description: task.description || '',
      daysRemaining: Math.abs(daysRemaining),
      daysLabel: daysRemaining === 1 ? 'dia' : 'dias',
      urgency: daysRemaining <= 3,
      isOverdue,
      taskUrl: task.taskUrl || `/tasks/${task.id}`,
      preferencesUrl: '/settings/notifications',
    },
  });
}

/**
 * Format task status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Progresso',
    completed: 'Concluída',
    blocked: 'Bloqueada',
    in_review: 'Em Revisão',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
  };

  return statusMap[status.toLowerCase()] || status;
}

/**
 * Batch trigger for multiple events
 * Useful for bulk operations
 */
export async function triggerMultiple(
  events: Array<{ type: string; data: unknown }>
): Promise<Array<{ eventType: string; success: boolean; error?: string }>> {
  const results: Array<{ eventType: string; success: boolean; error?: string }> = [];

  for (const event of events) {
    try {
      let success = false;

      switch (event.type) {
        case 'task_assigned': {
          const { task, assignedUser } = event.data as { task: TaskEvent; assignedUser: { id: string; email: string; name: string } };
          success = await onTaskAssigned(task, assignedUser);
          break;
        }
        case 'task_status_changed': {
          const { task, changedBy, comment } = event.data as { task: TaskEvent; changedBy: { id: string; name: string }; comment?: string };
          success = await onTaskStatusChanged(task, changedBy, comment);
          break;
        }
        case 'comment_mention': {
          const commentEvent = event.data as CommentEvent;
          success = await onCommentMention(commentEvent);
          break;
        }
        case 'deadline_approaching': {
          const { task, userId, userEmail, userName, daysRemaining } = event.data as {
            task: TaskEvent;
            userId: string;
            userEmail: string;
            userName: string;
            daysRemaining: number;
          };
          success = await onDeadlineApproaching(task, userId, userEmail, userName, daysRemaining);
          break;
        }
        default:
          throw new Error(`Unknown event type: ${event.type}`);
      }

      results.push({
        eventType: event.type,
        success,
      });
    } catch (error) {
      results.push({
        eventType: event.type,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
