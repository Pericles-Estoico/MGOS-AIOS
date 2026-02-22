import { streamRoutedMessage, type ConversationMessage, detectTaskCreationIntent } from '@/lib/ai/agent-router';
import { callAgent } from '@/lib/ai/agent-client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

interface GeneratedTask {
  title: string;
  description: string;
  channel: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * POST /api/marketplace/chat
 * Stream marketplace agent responses with optional task creation
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado', message: 'Faça login para usar o chat' },
        { status: 401 }
      );
    }

    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Convert conversation history format if provided
          const history: ConversationMessage[] = conversationHistory || [];

          let fullResponse = '';

          // Stream the routed message
          for await (const chunk of streamRoutedMessage(message, history)) {
            fullResponse += chunk;
            const encoded = encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            controller.enqueue(encoded);
          }

          // Check if user intends to create tasks
          if (detectTaskCreationIntent(message)) {
            try {
              const createdTasks = await createTasksFromMessage(message, session.user?.id || 'unknown');
              if (createdTasks && createdTasks.length > 0) {
                // Send tasks_created event
                const tasksData = encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'tasks_created',
                    tasks: createdTasks,
                    message: `✅ ${createdTasks.length} tarefa(s) criada(s) aguardando aprovação!`,
                  })}\n\n`
                );
                controller.enqueue(tasksData);
              }
            } catch (taskError) {
              console.error('Error creating tasks:', taskError);
              // Don't fail the chat, just log the error
            }
          }

          // Send completion signal
          const completedData = encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          );
          controller.enqueue(completedData);
          controller.close();
        } catch (error) {
          console.error('Error in chat stream:', error);
          const errorData = encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            })}\n\n`
          );
          controller.enqueue(errorData);
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create tasks from user message using LLM
 */
async function createTasksFromMessage(message: string, userId: string): Promise<GeneratedTask[] | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    console.warn('⚠️ Supabase not configured, skipping task creation');
    return null;
  }

  try {
    const taskExtractionPrompt = `Você é um assistente que extrai tarefas de mensagens de usuário.

Analise a mensagem do usuário e crie uma lista de tarefas claras e acionáveis.

Formato de resposta (JSON):
[
  {
    "title": "Título da tarefa",
    "description": "Descrição detalhada",
    "channel": "amazon|mercadolivre|shopee|shein|tiktok|kaway|general",
    "priority": "high|medium|low"
  },
  ...
]

Regras:
- Máximo 5 tarefas
- Tarefas devem ser específicas para moda bebê/infantil
- Prioridade 'high' apenas para tarefas críticas
- Channel deve ser baseado em marketplace mencionado
- Se nenhum marketplace mencionado, use 'general'

Mensagem do usuário: "${message}"

Extraia as tarefas em JSON puro, sem explicações extras.`;

    const response = await callAgent({
      systemPrompt: taskExtractionPrompt,
      userMessage: message,
      provider: 'openai',
      maxTokens: 1000,
    });

    // Parse JSON response
    const tasks = parseTasksFromResponse(response.content);

    if (tasks && tasks.length > 0) {
      // Save tasks to Supabase
      const dueDateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const tasksToInsert = tasks.map(task => ({
        title: task.title,
        description: task.description,
        channel: task.channel,
        priority: task.priority,
        status: 'pending',
        source_type: 'chat_generated',
        admin_approved: false,
        estimated_hours: 4,
        due_date: dueDateString,
        created_by: userId,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (error) {
        console.error('❌ Erro ao salvar tarefas no chat:', error);
        return null;
      }

      console.log(`✅ ${tasks.length} tarefas criadas via chat`);
      return tasks;
    }

    return null;
  } catch (error) {
    console.error('Error creating tasks from message:', error);
    return null;
  }
}

/**
 * Parse tasks from LLM response
 */
function parseTasksFromResponse(content: string): GeneratedTask[] | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      if (Array.isArray(parsed)) {
        const tasks: GeneratedTask[] = [];
        for (const item of parsed) {
          if (item.title && item.description && item.channel && item.priority) {
            tasks.push({
              title: item.title,
              description: item.description,
              channel: item.channel,
              priority: item.priority as 'low' | 'medium' | 'high',
            });
          }
        }
        return tasks.slice(0, 5); // Max 5 tasks per chat message
      }
    }
  } catch (error) {
    console.error('Error parsing tasks:', error);
  }

  return null;
}
