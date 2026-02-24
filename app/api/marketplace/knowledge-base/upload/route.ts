/**
 * NEXO Knowledge Base Upload - Learning System
 * POST /api/marketplace/knowledge-base/upload
 * Upload files (images, spreadsheets, documents) for NEXO to learn and analyze
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

interface KnowledgeBaseEntry {
  id: string;
  type: 'image' | 'spreadsheet' | 'document' | 'pdf' | 'text';
  filename: string;
  content: string;
  summary: string;
  marketplaces: string[];
  uploadedBy: string;
  uploadedAt: string;
  analysis: {
    keyInsights: string[];
    recommendations: string[];
    taskTemplates: string[];
  };
}

/**
 * Extract text from different file types
 */
async function extractFileContent(file: File, buffer: Buffer): Promise<string> {
  const filename = file.name.toLowerCase();
  const mimeType = file.type;

  // PDF handling
  if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
    try {
      // For now, return base64 representation
      // In production, use pdf-parse library
      return `[PDF Document: ${file.name}]\n${buffer.toString('base64').substring(0, 2000)}`;
    } catch (err) {
      console.error('PDF extraction error:', err);
      return `[PDF Document: ${file.name}] - Unable to parse`;
    }
  }

  // Image handling
  if (mimeType.startsWith('image/')) {
    return `[Image: ${file.name}]\nFormat: ${mimeType}\nSize: ${file.size} bytes\nBase64: ${buffer.toString('base64').substring(0, 1000)}...`;
  }

  // Text, CSV, JSON handling
  if (filename.endsWith('.txt') || filename.endsWith('.csv') || filename.endsWith('.json') || mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  // Excel/Spreadsheet handling
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || mimeType.includes('spreadsheet')) {
    // Return first 2000 chars of base64 representation
    return `[Spreadsheet: ${file.name}]\n${buffer.toString('base64').substring(0, 2000)}`;
  }

  // Default: return text representation
  return buffer.toString('utf-8', 0, Math.min(5000, buffer.length));
}

/**
 * Analyze content with Claude AI
 */
async function analyzeContentWithAI(
  content: string,
  filename: string,
  marketplaces: string[]
): Promise<{
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  taskTemplates: string[];
}> {
  // In production, call Claude API via @lib/ai/agent-client
  // For now, return structured analysis

  const summary = `Analyzed file: ${filename}\nContent length: ${content.length} chars\nTarget marketplaces: ${marketplaces.join(', ')}`;

  const keyInsights = [
    `File "${filename}" contains relevant data for ${marketplaces.length > 0 ? marketplaces.join(', ') : 'all'} marketplace(s)`,
    `Content includes ${content.includes('price') ? 'pricing information' : 'product information'}`,
    `Document suitable for agent learning and optimization`,
  ];

  const recommendations = [
    `Use insights to optimize agent prompts for ${marketplaces.length > 0 ? marketplaces[0] : 'primary'} marketplace`,
    'Create standardized task templates from extracted information',
    'Enable agents to reference this knowledge base during task generation',
  ];

  const taskTemplates = marketplaces.map((marketplace) => `Template for ${marketplace}: Use file "${filename}" as reference for ${marketplace}-specific optimizations`);

  return {
    summary,
    keyInsights,
    recommendations,
    taskTemplates,
  };
}

/**
 * POST - Upload and analyze files
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (!['admin', 'head'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head can upload knowledge base' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const marketplacesStr = formData.get('marketplaces') as string;
    const autoGenerateTasks = formData.get('autoGenerateTasks') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const marketplaces = marketplacesStr ? JSON.parse(marketplacesStr) : [];

    // Read file
    const buffer = await file.arrayBuffer();
    const bufferData = Buffer.from(buffer);

    // Extract content
    const content = await extractFileContent(file, bufferData);

    // Analyze with AI
    const analysis = await analyzeContentWithAI(content, file.name, marketplaces);

    // Save to database
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const knowledgeBaseEntry = {
      type: file.type.startsWith('image/') ? 'image' : 'document',
      filename: file.name,
      content: content.substring(0, 10000), // Store first 10k chars
      summary: analysis.summary,
      marketplaces,
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString(),
      analysis,
    };

    const { data: saved, error: saveError } = await supabase.from('knowledge_base').insert([knowledgeBaseEntry]).select().single();

    if (saveError) {
      console.error('Save error:', saveError);
      return NextResponse.json({ error: 'Failed to save knowledge base entry' }, { status: 500 });
    }

    console.log(`✅ Knowledge base entry saved: ${file.name}`);

    // If auto-generate tasks is enabled, create tasks for approval
    let generatedTasks = [];
    if (autoGenerateTasks && marketplaces.length > 0) {
      generatedTasks = await generateTasksFromKnowledge(
        saved.id,
        analysis,
        marketplaces,
        session.user.id,
        supabase
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Knowledge base entry created and analyzed',
      entry: saved,
      analysis,
      generatedTasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Knowledge base upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process knowledge base upload',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Generate tasks from knowledge base entry
 */
async function generateTasksFromKnowledge(
  knowledgeBaseId: string,
  analysis: any,
  marketplaces: string[],
  userId: string,
  supabase: any
): Promise<any[]> {
  const tasks = [];

  for (const marketplace of marketplaces) {
    // Create one task per marketplace for agent to process
    const task = {
      title: `Process Knowledge Base: ${analysis.summary.substring(0, 50)}...`,
      description: `Learn from uploaded file and generate optimization tasks for ${marketplace}.\n\nKey Insights:\n${analysis.keyInsights.join('\n')}\n\nRecommendations:\n${analysis.recommendations.join('\n')}`,
      channel: marketplace,
      status: 'pending_approval', // Requires human approval first
      knowledgeBaseId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      requiresApproval: true,
      approvalNotes: `Review and approve before agents process this knowledge for ${marketplace}`,
    };

    const { data: savedTask, error } = await supabase.from('knowledge_base_tasks').insert([task]).select().single();

    if (!error) {
      tasks.push(savedTask);
    }
  }

  return tasks;
}
