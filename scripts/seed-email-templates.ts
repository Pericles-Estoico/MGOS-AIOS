/**
 * Seed Email Templates into Database
 * Story 3.1: Email Notification System Phase 1
 *
 * Usage: npx ts-node scripts/seed-email-templates.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface EmailTemplate {
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
}

async function loadTemplateFile(filename: string): Promise<string> {
  const filePath = path.join(__dirname, '../lib/email-templates', filename);
  return fs.readFileSync(filePath, 'utf-8');
}

async function seedTemplates(): Promise<void> {
  console.log('🌱 Seeding email templates...\n');

  const templates: EmailTemplate[] = [
    {
      name: 'task_assigned',
      subject: 'Tarefa Atribuída: {{taskTitle}}',
      html_content: await loadTemplateFile('task-assigned.html'),
      text_content: 'Você foi atribuído à tarefa: {{taskTitle}}',
    },
    {
      name: 'status_changed',
      subject: 'Status Alterado: {{taskTitle}}',
      html_content: await loadTemplateFile('status-changed.html'),
      text_content: 'Status da tarefa {{taskTitle}} foi alterado para {{newStatus}}',
    },
    {
      name: 'comment_mention',
      subject: 'Você foi mencionado: {{taskTitle}}',
      html_content: await loadTemplateFile('comment-mention.html'),
      text_content: '{{authorName}} mencionou você em {{taskTitle}}',
    },
    {
      name: 'deadline_approaching',
      subject: 'Lembrete: {{taskTitle}} vence em {{dueDate}}',
      html_content: await loadTemplateFile('deadline-approaching.html'),
      text_content: 'Sua tarefa {{taskTitle}} vence em {{dueDate}}',
    },
  ];

  let seeded = 0;
  let updated = 0;
  let failed = 0;

  for (const template of templates) {
    try {
      console.log(`📧 Seeding: ${template.name}...`);

      const { data, error } = await supabase
        .from('email_templates')
        .upsert(
          {
            name: template.name,
            subject: template.subject,
            html_content: template.html_content,
            text_content: template.text_content,
          },
          { onConflict: 'name' }
        )
        .select();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      } else {
        if (data && data.length > 0) {
          const isNew = data[0].created_at === data[0].updated_at;
          if (isNew) {
            console.log(`   ✅ Created`);
            seeded++;
          } else {
            console.log(`   ✏️  Updated`);
            updated++;
          }
        }
      }
    } catch (err) {
      console.error(`   ❌ Unexpected error:`, err);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Seed Results:');
  console.log(`   Created: ${seeded}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n✅ All templates seeded successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some templates failed to seed');
    process.exit(1);
  }
}

// Run seed
seedTemplates().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
