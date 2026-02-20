import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailData {
  userId: string;
  recipientEmail: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, string | number | boolean | null>;
}

/**
 * Queue email for sending (instead of immediate send)
 */
export async function queueEmail(data: EmailData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        user_id: data.userId,
        recipient_email: data.recipientEmail,
        subject: data.subject,
        template_name: data.templateName,
        template_data: data.templateData || {},
        status: 'pending',
      });

    if (error) {
      console.error('Error queueing email:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error queueing email:', err);
    return false;
  }
}

/**
 * Process email queue (call this from a scheduled job)
 */
export async function processEmailQueue(): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  try {
    // Get pending emails
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error || !emails) {
      console.error('Error fetching pending emails:', error);
      return { processed: 0, failed: 0 };
    }

    // Process each email
    for (const email of emails) {
      try {
        // Check if user is in quiet hours
        const isQuietHours = await checkQuietHours(email.user_id);
        if (isQuietHours) {
          continue;
        }

        // Check for duplicate recently sent
        const isDuplicate = await checkDuplicateEmail(email.user_id, email.template_name);
        if (isDuplicate) {
          await updateEmailStatus(email.id, 'sent', null);
          processed++;
          continue;
        }

        // Load template
        const template = await getEmailTemplate(email.template_name);
        if (!template) {
          await updateEmailStatus(email.id, 'failed', 'Template not found');
          failed++;
          continue;
        }

        // Render template with data
        const { subject, html, text } = renderTemplate(
          template,
          email.template_data || {}
        );

        // Send email
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@taskops.com',
          to: email.recipient_email,
          subject: subject,
          html: html,
          text: text,
        });

        // Update status
        await updateEmailStatus(email.id, 'sent', null);
        processed++;

        // Track the send
        await supabase.from('email_tracking').insert({
          queue_id: email.id,
        });
      } catch (err) {
        console.error(`Error sending email ${email.id}:`, err);
        const retryCount = (email.retry_count || 0) + 1;
        await supabase
          .from('email_queue')
          .update({
            status: retryCount >= 3 ? 'failed' : 'pending',
            retry_count: retryCount,
            error_message: err instanceof Error ? err.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id);
        failed++;
      }
    }
  } catch (err) {
    console.error('Error processing email queue:', err);
  }

  return { processed, failed };
}

/**
 * Check if user is in quiet hours
 */
async function checkQuietHours(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('notification_preferences')
      .select('quiet_hours_start, quiet_hours_end')
      .eq('user_id', userId)
      .single();

    if (!data?.quiet_hours_start || !data?.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = data.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = data.quiet_hours_end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  } catch {
    return false;
  }
}

/**
 * Check if duplicate email was sent recently
 */
async function checkDuplicateEmail(
  userId: string,
  templateName: string
): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data } = await supabase
      .from('email_queue')
      .select('id')
      .eq('user_id', userId)
      .eq('template_name', templateName)
      .eq('status', 'sent')
      .gte('sent_at', oneHourAgo.toISOString())
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get email template
 */
async function getEmailTemplate(
  name: string
): Promise<{ subject: string; html: string; text?: string } | null> {
  try {
    const { data } = await supabase
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('name', name)
      .single();

    if (!data) return null;

    return {
      subject: data.subject,
      html: data.html_content,
      text: data.text_content,
    };
  } catch {
    return null;
  }
}

/**
 * Render template with data
 */
function renderTemplate(
  template: { subject: string; html: string; text?: string },
  data: Record<string, string | number | boolean>
): { subject: string; html: string; text?: string } {
  let subject = template.subject;
  let html = template.html;
  let text = template.text;

  // Simple variable replacement: {{variable}}
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, String(value));
    html = html.replace(regex, String(value));
    if (text) text = text.replace(regex, String(value));
  });

  return { subject, html, text };
}

/**
 * Update email status
 */
async function updateEmailStatus(
  id: string,
  status: string,
  errorMessage: string | null
): Promise<void> {
  await supabase
    .from('email_queue')
    .update({
      status,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

/**
 * Store email templates
 */
export async function storeEmailTemplates(): Promise<void> {
  const templates = [
    {
      name: 'task_assigned',
      subject: 'Tarefa Atribuída: {{taskTitle}}',
      html: `<h2>Nova Tarefa Atribuída</h2>
        <p>Olá {{userName}},</p>
        <p>Você foi atribuído à tarefa: <strong>{{taskTitle}}</strong></p>
        <p>Prioridade: {{priority}}</p>
        <p><a href="{{taskUrl}}">Ver Tarefa</a></p>`,
      text: 'Nova tarefa atribuída: {{taskTitle}}',
    },
    {
      name: 'task_approved',
      subject: 'Tarefa Aprovada: {{taskTitle}}',
      html: `<h2>Tarefa Aprovada ✓</h2>
        <p>Sua tarefa <strong>{{taskTitle}}</strong> foi aprovada pela QA!</p>
        <p><a href="{{taskUrl}}">Ver Tarefa</a></p>`,
      text: 'Sua tarefa foi aprovada!',
    },
    {
      name: 'task_rejected',
      subject: 'Tarefa Rejeitada: {{taskTitle}}',
      html: `<h2>Tarefa Rejeitada</h2>
        <p>Sua tarefa <strong>{{taskTitle}}</strong> foi rejeitada.</p>
        <p><strong>Motivo:</strong> {{reason}}</p>
        <p>Você pode reenviar depois de fazer as alterações necessárias.</p>`,
      text: 'Sua tarefa foi rejeitada',
    },
    {
      name: 'changes_requested',
      subject: 'Mudanças Solicitadas: {{taskTitle}}',
      html: `<h2>Mudanças Solicitadas</h2>
        <p>A QA solicitou mudanças em <strong>{{taskTitle}}</strong></p>
        <p><strong>Feedback:</strong></p>
        <p>{{feedback}}</p>
        <p><a href="{{taskUrl}}">Ver Detalhes</a></p>`,
      text: 'Mudanças solicitadas em sua tarefa',
    },
    {
      name: 'comment_mention',
      subject: 'Você foi mencionado: {{taskTitle}}',
      html: `<h2>Menção em Comentário</h2>
        <p>{{mentionerName}} mencionou você em <strong>{{taskTitle}}</strong></p>
        <p><strong>Comentário:</strong></p>
        <p>{{commentText}}</p>
        <p><a href="{{taskUrl}}">Ver Comentário</a></p>`,
      text: 'Você foi mencionado em um comentário',
    },
    {
      name: 'daily_digest',
      subject: 'Resumo Diário - {{date}}',
      html: `<h2>Seu Resumo Diário</h2>
        <p>Tarefas Atribuídas: {{assignedCount}}</p>
        <p>Tarefas Completas: {{completedCount}}</p>
        <p>Awaiting QA: {{pendingCount}}</p>
        <p><a href="{{dashboardUrl}}">Ver Dashboard</a></p>`,
      text: 'Seu resumo diário está pronto',
    },
  ];

  for (const template of templates) {
    await supabase.from('email_templates').upsert(
      {
        name: template.name,
        subject: template.subject,
        html_content: template.html,
        text_content: template.text,
      },
      { onConflict: 'name' }
    );
  }
}
