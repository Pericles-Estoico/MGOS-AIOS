/**
 * NEXO Orchestration Reports - Relatórios detalhados de performance
 * GET /api/marketplace/orchestration/reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import { performanceMonitor } from '@lib/marketplace-orchestration/services/performance-monitor';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only QA and admin can view reports
    const role = session.user.role as string;
    if (!['admin', 'head', 'qa'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - only admin/head/qa can view reports' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'summary';
    const format = searchParams.get('format') || 'json';

    console.log(`📋 Generating ${reportType} report in ${format} format...`);

    switch (reportType) {
      case 'summary':
        return await generateSummaryReport(format);

      case 'detailed':
        return await generateDetailedReport(format);

      case 'performance':
        return await generatePerformanceReport(format);

      case 'bottlenecks':
        return await generateBottleneckReport(format);

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${reportType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function generateSummaryReport(format: string) {
  const systemMetrics = await performanceMonitor.getSystemMetrics();
  const allMetrics = await performanceMonitor.getAllAgentMetrics();

  if (format === 'markdown') {
    const report = await performanceMonitor.generatePerformanceReport();
    return new NextResponse(report, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  return NextResponse.json({
    status: 'success',
    reportType: 'summary',
    timestamp: new Date().toISOString(),
    systemHealth: systemMetrics,
    agentSummary: allMetrics.map((m) => ({
      agent: m.agentName,
      score: m.performanceScore,
      generated: m.tasksGenerated,
      approved: m.tasksApproved,
      completed: m.tasksCompleted,
    })),
  });
}

async function generateDetailedReport(format: string) {
  const systemMetrics = await performanceMonitor.getSystemMetrics();
  const allMetrics = await performanceMonitor.getAllAgentMetrics();

  const channels = ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'];
  const channelMetrics = await Promise.all(
    channels.map((channel) => performanceMonitor.getChannelPerformance(channel))
  );

  if (format === 'markdown') {
    let markdown = '# NEXO Orchestration - Relatório Detalhado\n\n';
    markdown += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;

    markdown += '## Saúde do Sistema\n\n';
    markdown += `- **Status:** ${systemMetrics.systemHealth}\n`;
    markdown += `- **Agentes Ativos:** ${systemMetrics.activeAgents}/${systemMetrics.totalAgents}\n`;
    markdown += `- **Tarefas Geradas:** ${systemMetrics.totalTasksGenerated}\n`;
    markdown += `- **Tarefas Completadas:** ${systemMetrics.totalTasksCompleted}\n\n`;

    markdown += '## Desempenho por Agente\n\n';
    for (const metric of allMetrics) {
      const icon = metric.performanceScore >= 80 ? '✅' : metric.performanceScore >= 60 ? '⚠️' : '❌';
      markdown += `### ${icon} ${metric.agentName} (Score: ${metric.performanceScore}/100)\n\n`;
      markdown += `- Tarefas Geradas: ${metric.tasksGenerated}\n`;
      markdown += `- Aprovadas: ${metric.tasksApproved} (${metric.approvalRate.toFixed(1)}%)\n`;
      markdown += `- Completas: ${metric.tasksCompleted} (${metric.completionRate.toFixed(1)}%)\n`;
      markdown += `- Tempo Médio: ${metric.averageExecutionTime} minutos\n\n`;
    }

    markdown += '## Performance por Canal\n\n';
    for (const channel of channelMetrics) {
      markdown += `### ${channel.channel.charAt(0).toUpperCase() + channel.channel.slice(1)}\n\n`;
      markdown += `- Total de Tarefas: ${channel.totalTasks}\n`;
      markdown += `- Taxa de Conclusão: ${channel.completionRate.toFixed(1)}%\n`;
      markdown += `- Tempo Médio: ${channel.avgCompletionTime.toFixed(1)}h\n`;
      markdown += `- Agentes Ativos: ${channel.activeAgents}\n\n`;
    }

    return new NextResponse(markdown, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  return NextResponse.json({
    status: 'success',
    reportType: 'detailed',
    timestamp: new Date().toISOString(),
    systemMetrics,
    agentMetrics: allMetrics,
    channelMetrics,
  });
}

async function generatePerformanceReport(format: string) {
  const report = await performanceMonitor.generatePerformanceReport();

  if (format === 'markdown') {
    return new NextResponse(report, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  return NextResponse.json({
    status: 'success',
    reportType: 'performance',
    timestamp: new Date().toISOString(),
    report,
  });
}

async function generateBottleneckReport(format: string) {
  const systemMetrics = await performanceMonitor.getSystemMetrics();
  const allMetrics = await performanceMonitor.getAllAgentMetrics();

  const bottlenecks = allMetrics.filter((m) => m.performanceScore < 60);
  const lowApproval = allMetrics.filter((m) => m.approvalRate < 70);
  const lowCompletion = allMetrics.filter((m) => m.completionRate < 50);

  if (format === 'markdown') {
    let markdown = '# NEXO - Relatório de Gargalos\n\n';
    markdown += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;

    markdown += '## Agentes de Baixo Desempenho\n\n';
    if (bottlenecks.length === 0) {
      markdown += 'Nenhum agente em situação crítica.\n\n';
    } else {
      for (const agent of bottlenecks) {
        markdown += `- **${agent.agentName}**: Score ${agent.performanceScore}/100\n`;
      }
      markdown += '\n';
    }

    markdown += '## Taxa de Aprovação Baixa\n\n';
    if (lowApproval.length === 0) {
      markdown += 'Todas as taxas de aprovação estão saudáveis.\n\n';
    } else {
      for (const agent of lowApproval) {
        markdown += `- **${agent.agentName}**: ${agent.approvalRate.toFixed(1)}%\n`;
      }
      markdown += '\n';
    }

    markdown += '## Taxa de Conclusão Baixa\n\n';
    if (lowCompletion.length === 0) {
      markdown += 'Todas as taxas de conclusão estão saudáveis.\n\n';
    } else {
      for (const agent of lowCompletion) {
        markdown += `- **${agent.agentName}**: ${agent.completionRate.toFixed(1)}%\n`;
      }
      markdown += '\n';
    }

    markdown += '## Recomendações\n\n';
    for (const rec of systemMetrics.recommendations) {
      markdown += `- ${rec}\n`;
    }

    return new NextResponse(markdown, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  return NextResponse.json({
    status: 'success',
    reportType: 'bottlenecks',
    timestamp: new Date().toISOString(),
    bottlenecks: {
      lowPerformance: bottlenecks,
      lowApprovalRate: lowApproval,
      lowCompletionRate: lowCompletion,
    },
    recommendations: systemMetrics.recommendations,
  });
}
