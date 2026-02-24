/**
 * NEXO Advanced Optimization - Phase 4
 * ML-based agent routing & adaptive performance weighting
 * GET /api/marketplace/orchestration/optimization
 * POST /api/marketplace/orchestration/optimization/recommend
 * PATCH /api/marketplace/orchestration/optimization/weights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

interface AgentOptimization {
  agentId: string;
  agentName: string;
  baseScore: number;
  adaptiveWeights: {
    approvalRate: number; // 0-1, default 0.5
    completionRate: number; // 0-1, default 0.3
    executionTime: number; // 0-1, default 0.2
  };
  predictedPerformance: number; // 0-100 next period
  recommendedAction: 'increase_workload' | 'maintain' | 'reduce_workload' | 'retrain';
  lastOptimization: string;
}

interface RoutingRecommendation {
  taskType: string;
  channel: string;
  recommendedAgentId: string;
  alternativeAgents: Array<{
    agentId: string;
    score: number;
    reason: string;
  }>;
  confidence: number; // 0-100
  expectedSuccessRate: number; // 0-100
}

/**
 * Calculate adaptive weights based on historical performance
 * Uses exponential smoothing to emphasize recent performance
 */
function calculateAdaptiveWeights(
  agentMetrics: any,
  historicalData: any[]
): AgentOptimization['adaptiveWeights'] {
  // Base weights
  const baseWeights = {
    approvalRate: 0.5,
    completionRate: 0.3,
    executionTime: 0.2,
  };

  if (historicalData.length === 0) {
    return baseWeights;
  }

  // Calculate variance in metrics (higher variance = less reliable)
  const approvalRates = historicalData.map((d) => d.approvalRate || 0);
  const completionRates = historicalData.map((d) => d.completionRate || 0);
  const executionTimes = historicalData.map((d) => d.avgExecutionTime || 0);

  const variance = {
    approval: calculateVariance(approvalRates),
    completion: calculateVariance(completionRates),
    execution: calculateVariance(executionTimes),
  };

  // Normalize variance to weights (inverse relationship)
  const totalVariance = variance.approval + variance.completion + variance.execution;

  if (totalVariance === 0) {
    return baseWeights;
  }

  // If completion is consistently failing, increase weight for it
  const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
  const avgApproval = approvalRates.reduce((a, b) => a + b, 0) / approvalRates.length;

  const weights = {
    approvalRate: avgApproval < 70 ? 0.6 : 0.5,
    completionRate: avgCompletion < 60 ? 0.4 : 0.3,
    executionTime: avgCompletion < 60 ? 0.1 : 0.2,
  };

  // Normalize to sum to 1
  const sum = weights.approvalRate + weights.completionRate + weights.executionTime;
  return {
    approvalRate: weights.approvalRate / sum,
    completionRate: weights.completionRate / sum,
    executionTime: weights.executionTime / sum,
  };
}

/**
 * Calculate statistical variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Predict future performance using linear regression
 */
function predictPerformance(historicalData: any[]): number {
  if (historicalData.length < 2) {
    return 0;
  }

  const scores = historicalData.map((d) => {
    const score = d.performanceScore || 0;
    return score;
  });

  // Simple linear regression
  const n = scores.length;
  const sumX = (n * (n + 1)) / 2;
  const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
  const sumY = scores.reduce((a, b) => a + b, 0);
  const sumXY = scores.reduce((sum, y, i) => sum + (i + 1) * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next period
  const nextScore = slope * (n + 1) + intercept;
  return Math.max(0, Math.min(100, nextScore));
}

/**
 * Determine recommended action based on trend
 */
function getRecommendedAction(currentScore: number, predictedScore: number): AgentOptimization['recommendedAction'] {
  const trend = predictedScore - currentScore;

  if (currentScore >= 80 && trend > 0) {
    return 'increase_workload';
  }

  if (currentScore < 50) {
    return 'retrain';
  }

  if (currentScore >= 60 && currentScore < 70) {
    return 'reduce_workload';
  }

  return 'maintain';
}

/**
 * ML-based agent routing for task assignment
 */
async function recommendAgent(
  taskType: string,
  channel: string,
  supabase: any
): Promise<RoutingRecommendation> {
  // Fetch all agent metrics for this channel
  const { data: agents } = await supabase
    .from('agent_metrics')
    .select('*')
    .eq('channel', channel)
    .order('performance_score', { ascending: false })
    .limit(6);

  if (!agents || agents.length === 0) {
    return {
      taskType,
      channel,
      recommendedAgentId: 'unknown',
      alternativeAgents: [],
      confidence: 0,
      expectedSuccessRate: 0,
    };
  }

  // Score agents based on task type and channel specialization
  const scoredAgents = agents.map((agent: any) => {
    let score = agent.performance_score || 0;

    // Bonus for specialization
    if (agent.specialization === taskType) {
      score = Math.min(100, score + 10);
    }

    // Penalty for low approval rate
    if (agent.approval_rate < 70) {
      score = Math.max(0, score - 15);
    }

    // Penalty for high error rate
    const errorRate = (agent.failed_tasks || 0) / (agent.total_tasks || 1);
    if (errorRate > 0.1) {
      score = Math.max(0, score - 20);
    }

    return {
      agentId: agent.agent_id,
      agentName: agent.agent_name,
      score,
      reason: agent.specialization === taskType ? `Especialista em ${taskType}` : 'Desempenho geral',
    };
  });

  scoredAgents.sort((a: any, b: any) => b.score - a.score);

  const recommended = scoredAgents[0];
  const alternatives = scoredAgents.slice(1, 3);

  const confidence = Math.min(100, (recommended.score / 100) * 100);
  const expectedSuccessRate = Math.min(100, recommended.score * 0.95);

  return {
    taskType,
    channel,
    recommendedAgentId: recommended.agentId,
    alternativeAgents: alternatives,
    confidence,
    expectedSuccessRate,
  };
}

/**
 * GET - Get optimization metrics for all agents
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const agents = ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'];
    const optimizations: AgentOptimization[] = [];

    for (const agentId of agents) {
      // Fetch current metrics
      const { data: currentMetrics } = await supabase
        .from('agent_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch historical data (last 30 days)
      const { data: historicalData } = await supabase
        .from('agent_metrics_history')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (!currentMetrics) continue;

      const adaptiveWeights = calculateAdaptiveWeights(currentMetrics, historicalData || []);
      const predictedPerformance = predictPerformance(historicalData || [currentMetrics]);
      const recommendedAction = getRecommendedAction(currentMetrics.performance_score, predictedPerformance);

      optimizations.push({
        agentId,
        agentName: currentMetrics.agent_name,
        baseScore: currentMetrics.performance_score,
        adaptiveWeights,
        predictedPerformance: Math.round(predictedPerformance),
        recommendedAction,
        lastOptimization: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      optimizations,
      summary: {
        agentsNeedingRetraining: optimizations.filter((o) => o.recommendedAction === 'retrain').length,
        agentsReadyToScale: optimizations.filter((o) => o.recommendedAction === 'increase_workload').length,
        averagePredictedPerformance: Math.round(
          optimizations.reduce((sum, o) => sum + o.predictedPerformance, 0) / optimizations.length
        ),
      },
    });
  } catch (error) {
    console.error('Optimization fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch optimization data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Get agent routing recommendation for a task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskType, channel } = body;

    if (!taskType || !channel) {
      return NextResponse.json({ error: 'Missing taskType or channel' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const recommendation = await recommendAgent(taskType, channel, supabase);

    console.log(`🤖 Routing recommendation: ${recommendation.recommendedAgentId} for ${taskType} on ${channel}`);

    return NextResponse.json({
      status: 'success',
      recommendation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Routing recommendation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate routing recommendation',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update adaptive weights for an agent
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role as string;
    if (!['admin', 'head'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { agentId, weights } = body;

    if (!agentId || !weights) {
      return NextResponse.json({ error: 'Missing agentId or weights' }, { status: 400 });
    }

    // Validate weights sum to approximately 1
    const sum = weights.approvalRate + weights.completionRate + weights.executionTime;
    if (sum < 0.95 || sum > 1.05) {
      return NextResponse.json(
        { error: 'Weights must sum to 1.0 (tolerance: ±0.05)' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Save adaptive weights
    const { data: updated, error } = await supabase
      .from('agent_adaptive_weights')
      .upsert({
        agent_id: agentId,
        approval_rate_weight: weights.approvalRate,
        completion_rate_weight: weights.completionRate,
        execution_time_weight: weights.executionTime,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Weight update error:', error);
      return NextResponse.json({ error: 'Failed to update weights' }, { status: 500 });
    }

    console.log(`⚙️ Updated weights for ${agentId}:`, weights);

    return NextResponse.json({
      status: 'success',
      message: 'Adaptive weights updated',
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weight update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update adaptive weights',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
