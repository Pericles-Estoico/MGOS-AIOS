import nodemailer from 'nodemailer';

// Email service configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  secure: process.env.SMTP_SECURE === 'true',
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send email using Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const from = process.env.SMTP_FROM || 'noreply@mgos-aios.app';

    const result = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtmlTags(options.html),
      replyTo: options.replyTo || from,
    });

    console.log(`Email sent to ${options.to}:`, result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Strip HTML tags from HTML content for plain text version
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Email template: Task Assignment
 */
export function taskAssignmentEmail(
  userName: string,
  taskTitle: string,
  taskId: string,
  unsubscribeLink: string
): EmailOptions {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Nova Tarefa Atribuída</h2>
      <p>Olá ${escapeHtml(userName)},</p>
      <p>Uma nova tarefa foi atribuída a você:</p>
      <p style="background: #f5f5f5; padding: 10px; border-left: 4px solid #007bff;">
        <strong>${escapeHtml(taskTitle)}</strong>
      </p>
      <p>
        <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/tasks/${taskId}"
           style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Ver Tarefa
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        <a href="${escapeHtml(unsubscribeLink)}">Desinscrever-se de notificações</a>
      </p>
    </div>
  `;

  return {
    subject: `Nova Tarefa: ${taskTitle}`,
    html,
    text: `Nova Tarefa Atribuída\n\nOlá ${userName},\n\nUma nova tarefa foi atribuída a você: ${taskTitle}\n\nVer Tarefa: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks/${taskId}`,
    to: '', // Will be set by caller
  };
}

/**
 * Email template: QA Review Feedback
 */
export function qaReviewFeedbackEmail(
  userName: string,
  taskTitle: string,
  status: 'approved' | 'rejected',
  feedback: string,
  taskId: string,
  unsubscribeLink: string
): EmailOptions {
  const statusText = status === 'approved' ? 'Aprovada' : 'Rejeitada';
  const statusColor = status === 'approved' ? '#28a745' : '#dc3545';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Revisão de QA: ${statusText}</h2>
      <p>Olá ${escapeHtml(userName)},</p>
      <p>Sua evidência para a tarefa foi <strong style="color: ${statusColor};">${statusText}</strong>:</p>
      <p style="background: #f5f5f5; padding: 10px; border-left: 4px solid ${statusColor};">
        <strong>${escapeHtml(taskTitle)}</strong>
      </p>
      ${feedback ? `
        <p><strong>Feedback:</strong></p>
        <p>${escapeHtml(feedback).replace(/\n/g, '<br>')}</p>
      ` : ''}
      <p>
        <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/tasks/${taskId}"
           style="background: ${statusColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Ver Detalhes
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        <a href="${escapeHtml(unsubscribeLink)}">Desinscrever-se de notificações</a>
      </p>
    </div>
  `;

  return {
    subject: `QA ${statusText}: ${taskTitle}`,
    html,
    text: `Revisão de QA: ${statusText}\n\nOlá ${userName},\n\nSua evidência foi ${statusText}.\n\n${feedback ? `Feedback: ${feedback}` : ''}\n\nVer Detalhes: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks/${taskId}`,
    to: '', // Will be set by caller
  };
}

/**
 * Email template: Welcome Email
 */
export function welcomeEmail(userName: string, unsubscribeLink: string): EmailOptions {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bem-vindo ao MGOS-AIOS!</h2>
      <p>Olá ${escapeHtml(userName)},</p>
      <p>Sua conta foi criada com sucesso.</p>
      <p>
        <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}"
           style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Acessar Aplicação
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        <a href="${escapeHtml(unsubscribeLink)}">Gerenciar Preferências de Notificação</a>
      </p>
    </div>
  `;

  return {
    subject: 'Bem-vindo ao MGOS-AIOS',
    html,
    text: `Bem-vindo ao MGOS-AIOS!\n\nOlá ${userName},\n\nSua conta foi criada com sucesso.\n\nAcesse a aplicação: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
    to: '', // Will be set by caller
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
