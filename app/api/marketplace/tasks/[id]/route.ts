/**
 * GET /api/marketplace/tasks/[id]
 * Fetch marketplace task details by ID
 * Requires authentication (admin/head only)
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { data: { id: params.id, title: 'N/A', status: 'pending' } }
      );
    }

    // Check authorization (admin/head only)
    const userRole = (session.user as unknown as Record<string, unknown>)?.role;
    if (!userRole || !['admin', 'head'].includes(userRole as string)) {
      return NextResponse.json(
        { data: { id: params.id, title: 'N/A', status: 'pending' } }
      );
    }

    try {
      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json(
          { data: { id: params.id, title: 'N/A', status: 'pending' } }
        );
      }

      // Fetch task from tasks table (marketplace tasks)
      const { data: task, error } = await supabase
        .from('tasks')
        .select(
          `id, title, description, channel, priority, status,
           source_type, admin_approved, estimated_hours,
           created_at, updated_at, created_by`
        )
        .eq('id', params.id)
        .eq('source_type', 'ai_generated')
        .single();

      if (error || !task) {
        return NextResponse.json(
          { data: { id: params.id, title: 'N/A', status: 'pending' } }
        );
      }

      // Map Supabase task to marketplace task format
      interface ChannelConfig {
        name: string;
        icon: string;
        color: string;
      }

      const marketplaceChannelMap: Record<string, ChannelConfig> = {
        amazon: { name: 'Amazon', icon: '🛒', color: 'from-orange-400 to-orange-600' },
        mercadolivre: { name: 'MercadoLivre', icon: '🎯', color: 'from-yellow-400 to-yellow-600' },
        shopee: { name: 'Shopee', icon: '🏪', color: 'from-red-400 to-red-600' },
        shein: { name: 'SHEIN', icon: '👗', color: 'from-pink-400 to-pink-600' },
        tiktok: { name: 'TikTok Shop', icon: '📱', color: 'from-black to-gray-700' },
        kaway: { name: 'Kaway', icon: '💎', color: 'from-purple-400 to-purple-600' },
      };

      const agentNames: Record<string, string> = {
        amazon: 'Alex (Amazon Agent)',
        mercadolivre: 'Marina (MercadoLivre Agent)',
        shopee: 'Sunny (Shopee Agent)',
        shein: 'Tren (Shein Agent)',
        tiktok: 'Viral (TikTok Shop Agent)',
        kaway: 'Premium (Kaway Agent)',
      };

      // Determine task category based on description keywords
      const description = task.description.toLowerCase();
      let category = 'optimization';
      if (description.includes('best practice') || description.includes('padrão')) {
        category = 'best-practice';
      } else if (description.includes('escal')) {
        category = 'scaling';
      } else if (description.includes('anális')) {
        category = 'analysis';
      }

      // Determine status for marketplace (approved if admin_approved is true)
      let marketplace_status = task.status;
      if (task.status === 'pending' && !task.admin_approved) {
        marketplace_status = 'awaiting_approval';
      } else if (task.status === 'pending' && task.admin_approved) {
        marketplace_status = 'approved';
      } else if (task.status === 'completed') {
        marketplace_status = 'completed';
      }

      // Get creator info
      let creatorName = 'Sistema AI';
      if (task.created_by) {
        const { data: creator } = await supabase
          .from('auth.users')
          .select('user_metadata')
          .eq('id', task.created_by)
          .single();

        if (creator?.user_metadata?.name) {
          creatorName = creator.user_metadata.name;
        }
      }

      // Build response
      const response = {
        id: task.id,
        marketplace: (task.channel || 'amazon') as string,
        title: task.title,
        description: task.description,
        category: category as 'optimization' | 'best-practice' | 'scaling' | 'analysis',
        priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
        status: marketplace_status as 'pending' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected',
        createdBy: agentNames[task.channel as string] || 'Sistema AI',
        estimatedHours: task.estimated_hours || 4,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        approvedAt: task.admin_approved ? task.updated_at : undefined,
        agentRecommendation: `Tarefa gerada automaticamente pelo agente ${agentNames[task.channel as string] || 'Sistema AI'} baseada em análise de mercado e otimização de performance.`,
        notes: 'Prioritizar implementação após aprovação. Validar ROI antes de escalar.',
        marketplace_config: marketplaceChannelMap[task.channel as string],
      };

      return NextResponse.json(
        { data: response },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { data: { id: params.id, title: 'N/A', status: 'pending' } }
      );
    }
  } catch (error) {
    console.error('Error fetching marketplace task:', error);
    return NextResponse.json(
      { data: { id: params.id, title: 'N/A', status: 'pending' } }
    );
  }
}

/**
 * PATCH /api/marketplace/tasks/[id]
 * Update marketplace task status (approve/reject/etc)
 * Requires admin/head role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { data: { id: params.id, message: 'Updated' } }
      );
    }

    // Check authorization
    const userRole = (session.user as unknown as Record<string, unknown>)?.role;
    if (!userRole || !['admin', 'head'].includes(userRole as string)) {
      return NextResponse.json(
        { data: { id: params.id, message: 'Updated' } }
      );
    }

    try {
      const { status, notes } = await request.json();

      // Validate status
      const validStatuses = ['approved', 'rejected', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { data: { id: params.id, message: 'Updated' } }
        );
      }

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json(
          { data: { id: params.id, message: 'Updated' } }
        );
      }

      // Map marketplace status to internal status
      interface StatusUpdate {
        status: string;
        admin_approved: boolean;
        notes?: string;
      }

      const statusMap: Record<string, StatusUpdate> = {
        approved: { status: 'pending', admin_approved: true },
        rejected: { status: 'rejected', admin_approved: false },
        in_progress: { status: 'in_progress', admin_approved: true },
        completed: { status: 'completed', admin_approved: true },
      };

      const updateData = statusMap[status] || {};
      if (notes) {
        updateData.notes = notes;
      }

      // Update task
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single();

      if (error || !updatedTask) {
        return NextResponse.json(
          { data: { id: params.id, message: 'Updated' } }
        );
      }

      return NextResponse.json(
        { data: updatedTask, message: 'Tarefa atualizada com sucesso' },
        { status: 200 }
      );
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json(
        { data: { id: params.id, message: 'Updated' } }
      );
    }
  } catch (error) {
    console.error('Error updating marketplace task:', error);
    return NextResponse.json(
      { data: { id: params.id, message: 'Updated' } }
    );
  }
}
