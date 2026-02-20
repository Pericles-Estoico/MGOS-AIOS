# 📊 Marketplace Master — Monitoramento & Performance

**Data:** Fevereiro 20, 2026
**Status:** ✅ Pronto para Monitoramento
**Versão:** 1.0.0

---

## 📋 Visão Geral

Este guia cobre monitoramento completo de:

1. **Application Performance** — Latência, throughput, errors
2. **Agent Metrics** — Task creation, approval rates, completion times
3. **Database Health** — Query performance, connection pool, storage
4. **Infrastructure** — Server resources, scaling events, uptime
5. **Business Metrics** — Marketplace revenue, task volume, conversion rates

---

## 🎯 Monitoring Stack

### Stack Recomendado

```
Frontend Metrics
        ↓
    Sentry (Error Tracking)
    New Relic (APM)
    Datadog (Observability)
        ↓
    Backend Logs
        ↓
    ELK Stack (Elasticsearch, Logstash, Kibana)
    CloudWatch (AWS)
    Stackdriver (GCP)
        ↓
    Database Metrics
        ↓
    Supabase Monitoring
    Postgres Monitoring
        ↓
    Custom Dashboard
```

---

## 🚨 Alertas Críticos

### 1. Application Errors

```yaml
Alert: "Application Error Rate > 5%"
Threshold: error_rate >= 0.05
Window: 5 minutes
Action:
  - Notify #marketplace-alerts Slack channel
  - Page on-call engineer
  - Auto-rollback if critical
```

### 2. Agent Performance

```yaml
Alert: "Agent Task Completion Time > 24h"
Threshold: avg_completion_time >= 86400
Window: 1 hour
Action:
  - Notify agent owner
  - Create incident
  - Check agent logs

Alert: "Agent Approval Rate < 80%"
Threshold: approval_rate < 0.8
Window: 1 hour
Action:
  - Notify @po (Pax)
  - Review task queue
  - Escalate to @pm
```

### 3. Database Health

```yaml
Alert: "Database Connection Pool Exhausted"
Threshold: active_connections >= max_connections * 0.9
Window: 1 minute
Action:
  - Scale database (read replicas)
  - Notify @data-engineer
  - Page on-call DBA

Alert: "Slow Query Detected"
Threshold: query_duration >= 1000ms
Window: Immediate
Action:
  - Log to monitoring system
  - Add to slow query index
  - Alert if > 10 per minute
```

### 4. Infrastructure

```yaml
Alert: "High CPU Usage"
Threshold: cpu >= 80%
Window: 5 minutes
Action:
  - Scale horizontally
  - Notify @devops

Alert: "Disk Space Critical"
Threshold: disk_used >= 90%
Window: 1 hour
Action:
  - Clean old logs
  - Expand volume
  - Notify @devops

Alert: "Memory Leak Detected"
Threshold: memory_growth >= 100MB per hour
Window: 1 hour
Action:
  - Graceful restart
  - Notify engineering
  - Investigate cause
```

---

## 📈 Dashboards

### 1. Master Dashboard

**URL:** `/admin/monitoring/dashboard`

**Widgets:**

```
┌─────────────────────────────────────────────┐
│         MARKETPLACE MASTER DASHBOARD         │
├─────────────────────────────────────────────┤
│                                              │
│  Status: ✅ Healthy                         │
│  Uptime: 99.98% (Last 30 days)             │
│  Response Time: 145ms (avg)                │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  🎯 Key Metrics                            │
│  ├─ Total Tasks: 2,451                     │
│  ├─ Completed: 1,923 (78%)                 │
│  ├─ Pending: 245 (10%)                     │
│  └─ Failed: 283 (12%)                      │
│                                              │
│  📊 Agent Performance                       │
│  ├─ Amazon: 445 tasks (92% completion)    │
│  ├─ Shopee: 312 tasks (88% completion)    │
│  ├─ MercadoLivre: 289 tasks (85%)         │
│  ├─ SHEIN: 178 tasks (91% completion)     │
│  ├─ TikTok Shop: 156 tasks (94%)          │
│  └─ Kaway: 71 tasks (90% completion)      │
│                                              │
│  ⚡ Performance                             │
│  ├─ Avg Task Time: 4.2 hours              │
│  ├─ P95 Latency: 250ms                    │
│  ├─ P99 Latency: 450ms                    │
│  └─ Error Rate: 0.3%                      │
│                                              │
└─────────────────────────────────────────────┘
```

### 2. Agent Performance Dashboard

**URL:** `/admin/monitoring/agents`

**For each agent:**

```
┌─────────────────────────────────────┐
│    AMAZON AGENT PERFORMANCE         │
├─────────────────────────────────────┤
│                                      │
│  Status: 🟢 Online                  │
│  Last Activity: 2 minutes ago       │
│                                      │
│  📈 Statistics                       │
│  ├─ Tasks Created: 445              │
│  ├─ Tasks Approved: 410 (92%)       │
│  ├─ Tasks Completed: 410 (92%)      │
│  ├─ Tasks Rejected: 35 (8%)         │
│  └─ Tasks In Progress: 0            │
│                                      │
│  ⏱️  Timing                          │
│  ├─ Avg Creation Time: 2.1 sec     │
│  ├─ Avg Approval Time: 1.2 hours   │
│  ├─ Avg Execution Time: 3.5 hours  │
│  └─ Avg Completion: 4.7 hours      │
│                                      │
│  💯 Quality Scores                   │
│  ├─ Approval Rate: 92%              │
│  ├─ Completion Rate: 93%            │
│  ├─ Quality Score: 88/100           │
│  └─ Efficiency: 87%                 │
│                                      │
│  🚨 Alerts                           │
│  └─ None                             │
│                                      │
└─────────────────────────────────────┘
```

### 3. Real-Time Monitoring

**URL:** `/admin/monitoring/real-time`

```
Task Stream (Live Update):
┌────────────────────────────────────────┐
│ 17:05:32 ✅ Amazon: "Optimize titles"  │
│          Status: created → approved    │
│                                        │
│ 17:05:28 ✅ Shopee: "Flash sale prep" │
│          Status: pending → awaiting    │
│                                        │
│ 17:05:15 ✅ MercadoLivre: "Geo desc"  │
│          Status: approved → in_prog   │
│                                        │
│ 17:04:52 ✅ SHEIN: "Trend analysis"   │
│          Status: in_progress → done    │
│                                        │
└────────────────────────────────────────┘

Auto-refresh every 2 seconds
```

---

## 📊 Key Performance Indicators (KPIs)

### Application KPIs

```typescript
interface ApplicationMetrics {
  uptime: number;                  // percentage
  responseTime: number;             // ms (avg, p50, p95, p99)
  errorRate: number;               // percentage
  requestsPerSecond: number;       // throughput
  apdex: number;                   // Application Performance Index (0-1)
  criticalErrors: number;          // count
}
```

### Agent KPIs

```typescript
interface AgentMetrics {
  tasksCreated: number;
  tasksApproved: number;
  tasksCompleted: number;
  tasksRejected: number;
  approvalRate: number;            // approved / created %
  completionRate: number;          // completed / approved %
  qualityScore: number;            // 0-100
  avgCompletionTime: number;       // hours
  avgEfficiency: number;           // estimated / actual hours %
  lastActivityAt: Date;
  status: 'online' | 'offline' | 'degraded';
}
```

### Database KPIs

```typescript
interface DatabaseMetrics {
  queryExecutionTime: number;      // ms
  slowQueriesCount: number;        // > 1s
  connectionPoolUtilization: number; // percentage
  activeConnections: number;
  indexFragmentation: number;      // percentage
  replicationLag: number;          // seconds
  storageSizeGb: number;
  readOperationsPerSecond: number;
  writeOperationsPerSecond: number;
}
```

---

## 🔧 Setup Sentry (Error Tracking)

### 1. Install Sentry SDK

```bash
npm install @sentry/nextjs
```

### 2. Configure Sentry

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  serverName: "marketplace-master",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
});

export { captureException, captureMessage };
```

### 3. Capture Errors

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Risky operation
  await processAgentTask(task);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      agent: task.created_by,
      marketplace: task.marketplace,
      taskId: task.id,
    },
    contexts: {
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
      },
    },
  });
}
```

---

## 🔧 Setup Datadog (Full Observability)

### 1. Install Datadog Agent

```bash
# Docker
docker run -d --name datadog \
  -e DD_API_KEY=$DATADOG_API_KEY \
  -e DD_SITE=datadoghq.com \
  datadog/agent:latest

# or Node.js tracer
npm install dd-trace
```

### 2. Configure APM

```typescript
// Node.js tracer
import tracer from 'dd-trace';

tracer.init({
  service: 'marketplace-master',
  env: process.env.NODE_ENV,
  hostname: 'localhost',
  samplingPriority: 'auto_keep',
});

tracer.use('http', {
  blacklist: ['/health', '/metrics'],
});
```

### 3. Custom Metrics

```typescript
import StatsD from 'node-statsd';

const statsd = new StatsD();

// Track task completion
statsd.increment('marketplace.task.completed', 1, [
  `marketplace:${task.marketplace}`,
  `agent:${task.created_by}`,
]);

// Track timing
const startTime = Date.now();
await executeTask(task);
const duration = Date.now() - startTime;
statsd.timing('marketplace.task.duration', duration, [
  `marketplace:${task.marketplace}`,
]);

// Track gauge (real-time value)
statsd.gauge('marketplace.pending_tasks', pendingCount);
```

---

## 📈 Custom Dashboard (React Component)

```typescript
// app/admin/monitoring/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface DashboardMetrics {
  timestamp: Date;
  responseTime: number;
  errorRate: number;
  requestsPerSecond: number;
  taskCompletion: number;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/monitoring/metrics');
      const data = await response.json();
      setMetrics(prev => [...prev.slice(-59), data]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Marketplace Monitoring</h1>

      {/* Response Time Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Response Time (Last Hour)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics}>
            <CartesianGrid />
            <XAxis dataKey="timestamp" />
            <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="responseTime" stroke="#2563eb" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Task Completion Rate */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Task Completion Rate</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics}>
            <CartesianGrid />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="taskCompletion" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Error Rate Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Error Rate</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="errorRate" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Requests Per Second</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requestsPerSecond" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Metrics Endpoint

```typescript
// app/api/monitoring/metrics/route.ts
export async function GET() {
  const metricsData = {
    timestamp: new Date(),

    // Application metrics
    uptime: calculateUptime(),
    responseTime: await getAverageResponseTime(),
    errorRate: await getErrorRate(),
    requestsPerSecond: await getRequestsPerSecond(),

    // Agent metrics
    agents: await getAgentMetrics(),

    // Database metrics
    database: await getDatabaseMetrics(),

    // Task metrics
    tasks: {
      total: await getTotalTasks(),
      completed: await getCompletedTasks(),
      pending: await getPendingTasks(),
      failed: await getFailedTasks(),
      completionRate: await getCompletionRate(),
      avgCompletionTime: await getAvgCompletionTime(),
    },

    // Resource metrics
    resources: {
      cpuUsage: getCpuUsage(),
      memoryUsage: getMemoryUsage(),
      diskUsage: getDiskUsage(),
    },
  };

  return Response.json(metricsData);
}
```

---

## 🔔 Slack Alerts Integration

```typescript
// lib/slack-alerts.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendAlert(
  channel: string,
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'critical'
) {
  const color = {
    info: '#0099ff',
    warning: '#ffaa00',
    critical: '#ff0000',
  }[severity];

  await slack.chat.postMessage({
    channel,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 ${severity.toUpperCase()}: ${title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_${new Date().toISOString()}_`,
          },
        ],
      },
    ],
  });
}
```

---

## 📋 Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date(),

    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      externalApis: await checkExternalApis(),
      agents: await checkAgents(),
    },

    metrics: {
      responseTime: '145ms',
      errorRate: '0.3%',
      uptime: '99.98%',
    },
  };

  const allHealthy = Object.values(health.checks)
    .every(check => check.status === 'healthy');

  return Response.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

---

## 📈 Grafana Dashboards (Optional)

```yaml
# grafana/provisioning/dashboards/marketplace.json
{
  "dashboard": {
    "title": "Marketplace Master",
    "panels": [
      {
        "title": "Task Completion Rate",
        "targets": [
          {
            "expr": "rate(marketplace_tasks_completed_total[5m])"
          }
        ]
      },
      {
        "title": "Agent Performance",
        "targets": [
          {
            "expr": "marketplace_agent_tasks{marketplace=~\"amazon|shopee|mercadolivre\"}"
          }
        ]
      }
    ]
  }
}
```

---

## ✅ Monitoring Checklist

- [ ] Sentry configurado para error tracking
- [ ] Datadog ou New Relic para APM
- [ ] Custom dashboard implementado
- [ ] Alertas configurados no Slack
- [ ] Health check endpoint funcionando
- [ ] Database monitoring ativo
- [ ] Agent performance metrics coletando
- [ ] Logs centralizados (ELK ou CloudWatch)
- [ ] Log retention policies definidas
- [ ] Dashboards atualizados
- [ ] Team notificado sobre alertas
- [ ] On-call rotation setup
- [ ] Runbook para escalação preparado

---

**Status:** ✅ Pronto para Monitoramento em Produção
**Última Atualização:** Fevereiro 20, 2026
**Versão:** 1.0.0
