# NEXO Marketplace Orchestration - Phase 2: Dashboard & Monitoring

**Data:** 2026-02-24
**Status:** ✅ **COMPLETE** - Full dashboard implementation
**Phase:** v2 - Real-time Monitoring & Admin Control

## 🎯 What's New in Phase 2

### ✨ Features Added

1. **Real-time Dashboard** - Live metrics and agent status
2. **Agent Performance Cards** - Visual score and metrics per agent
3. **System Health Monitoring** - Overall system status indicator
4. **Alerts & Bottleneck Detection** - Identify and notify issues
5. **Automatic Refresh** - Optional auto-update every 30 seconds
6. **Admin Controls** - Activate NEXO and manage orchestration
7. **Detailed Reports** - Multiple report formats (JSON/Markdown)

---

## 📍 Dashboard Location

**URL:** `https://www.sellerops.com.br/marketplace/orchestration`

**Access:** Any authenticated user (full view with admin features if admin role)

---

## 🎨 Dashboard Components

### 1. Header Section
- Title and description
- **Refresh Button** - Manual update
- **Activate NEXO** button (admin only) - Triggers orchestration
- Auto-refresh toggle

### 2. System Health Card
Shows 5 key metrics:
- 🏥 **System Health** - Excellent/Good/Fair/Poor status
- 👥 **Active Agents** - Count of active agents (0-6)
- 🎯 **Tasks Generated** - Total tasks created by all agents
- ✅ **Tasks Completed** - Total completed tasks
- 📊 **Completion Rate** - Overall completion percentage

**Color Coding:**
- 🟢 Green (Excellent) - All metrics above 85%
- 🔵 Blue (Good) - All metrics above 70%
- 🟡 Yellow (Fair) - Metrics 60-70%
- 🔴 Red (Poor) - Metrics below 60%

### 3. Alerts & Recommendations
Two conditional cards:
- **⚠️ Bottlenecks** - Issues detected in agent performance
- **💡 Recommendations** - Suggested improvements

Examples:
```
⚠️ Gargalos Identificados:
- Alex com baixo desempenho

💡 Recomendações:
- Revise critérios de aprovação. Taxa muito baixa.
- Otimize workflow de execução de tarefas
```

### 4. Agent Performance Grid
6 cards (one per agent) showing:

```
┌─────────────────────────────┐
│ Agent Name      Score: 68/100│
│ (Channel Info)              │
├─────────────────────────────┤
│ Geradas: 12    Aprovadas: 10 │
│ Completas: 5   Rejeitadas: 2 │
├─────────────────────────────┤
│ Taxa Aprovação: 83.3%       │
│ ████████░ 83%              │
│ Taxa Conclusão: 41.7%       │
│ ████░░░░░ 42%              │
├─────────────────────────────┤
│ Last activity: 2026-02-24... │
└─────────────────────────────┘
```

**Color Coding by Score:**
- 🟢 Score ≥80 = Green background
- 🟡 Score 60-79 = Yellow background
- 🔴 Score <60 = Red background

### 5. Detailed Report Section
Full markdown report showing:
- All agent metrics
- Channel performance
- System recommendations
- Complete history

---

## 🎮 How to Use

### For Regular Users

1. **Navigate to Dashboard**
   - Go to: https://www.sellerops.com.br/marketplace/orchestration
   - View real-time metrics and agent status

2. **Monitor Agent Performance**
   - Each agent card shows performance score (0-100)
   - Green bars indicate approval and completion rates
   - Last activity timestamp shows recent updates

3. **Enable Auto-Refresh**
   - Check "Auto-atualizar a cada 30 segundos" at bottom
   - Dashboard updates automatically every 30 seconds

4. **View Alerts**
   - Red "⚠️ Gargalos" section shows bottlenecks
   - Blue "💡 Recomendações" section shows improvement suggestions

### For Admin Users

**Additional capabilities:**

1. **Activate NEXO Orchestration**
   - Click blue "▶️ Ativar NEXO" button
   - Selects all 6 channels automatically
   - Creates orchestration plan
   - Agents generate tasks immediately

   **Flow:**
   ```
   Click "Ativar NEXO"
   → POST /api/marketplace/orchestration/activate
   → Creates plan with all channels
   → Agents generate tasks
   → Dashboard refreshes with new metrics
   ```

2. **Monitor Real-time**
   - Watch task counts increase
   - See approval/completion rates update
   - Identify bottlenecks immediately

3. **View Detailed Reports**
   - Click "Relatório Detalhado" section
   - Pre-formatted markdown for all metrics
   - Copyable for external sharing

---

## 🔧 Technical Implementation

### New Files Created

**Pages:**
- `app/(dashboard)/marketplace/orchestration/page.tsx` (280 lines)
  - Main dashboard component
  - Real-time metrics fetching
  - Admin controls

**Components:**
- `app/components/marketplace/orchestration-card.tsx` (80 lines)
  - Reusable card for quick overview
  - Can be embedded elsewhere

**Hooks:**
- `app/hooks/useOrchestrationMetrics.ts` (90 lines)
  - Custom hook for metrics management
  - Auto-refresh support
  - Error handling

**APIs:**
- `app/api/marketplace/orchestration/alerts/route.ts` (140 lines)
  - POST - Create alert
  - GET - List alerts with filters
  - Ready for Slack/Email integration

- `app/api/marketplace/orchestration/reports/route.ts` (240 lines)
  - GET with query params for report type
  - Supports: summary, detailed, performance, bottlenecks
  - Formats: JSON and Markdown

### Data Flow

```
Dashboard Component
    ↓
useOrchestrationMetrics Hook
    ↓
/api/marketplace/orchestration/metrics
    ↓
PerformanceMonitor Service
    ↓
Database (tasks table)
    ↓
Metrics Calculation
    ↓
Display in UI
```

### Real-time Updates

```
User opens dashboard
    ↓
Initial fetch of metrics (useEffect)
    ↓
User enables auto-refresh
    ↓
setInterval every 30 seconds
    ↓
Fetch latest metrics
    ↓
Update component state
    ↓
Re-render with new data
```

---

## 📊 Report Types

### Via API

```bash
# Summary Report (JSON)
curl https://www.sellerops.com.br/api/marketplace/orchestration/reports?type=summary

# Summary Report (Markdown)
curl https://www.sellerops.com.br/api/marketplace/orchestration/reports?type=summary&format=markdown

# Detailed Report
curl https://www.sellerops.com.br/api/marketplace/orchestration/reports?type=detailed

# Performance Report
curl https://www.sellerops.com.br/api/marketplace/orchestration/reports?type=performance

# Bottleneck Report
curl https://www.sellerops.com.br/api/marketplace/orchestration/reports?type=bottlenecks&format=markdown
```

### Report Contents

**Summary:**
- System health status
- Agent summaries (score, task counts)

**Detailed:**
- Full system metrics
- Agent metrics with time averages
- Channel performance breakdown

**Performance:**
- Complete PerformanceMonitor report
- Agent scores and rates
- Bottleneck analysis
- System recommendations

**Bottlenecks:**
- Low-performing agents
- Low approval rates
- Low completion rates
- Corrective recommendations

---

## 🎯 Key Metrics Explained

### Performance Score (0-100)
```
Formula: (approvalRate * 0.5) + (completionRate * 0.3) + (executionTime * 0.2)

80-100 = ✅ Excellent (agent is optimized)
60-79  = ⚠️ Good (can improve)
<60    = ❌ Critical (needs optimization)
```

### Approval Rate
```
% of tasks approved by admin
= (tasks_approved / tasks_generated) * 100

Target: ≥85%
```

### Completion Rate
```
% of tasks that reached 'completed' status
= (tasks_completed / tasks_generated) * 100

Target: ≥85%
```

### System Health
```
Excellent: approval ≥85% AND completion ≥85%
Good:      approval ≥70% AND completion ≥70%
Fair:      approval 60-70% OR completion 60-70%
Poor:      approval <60% OR completion <60%
```

---

## 🐛 Troubleshooting

### Dashboard shows "401 Unauthorized"
**Cause:** Not logged in
**Fix:** Login first at https://www.sellerops.com.br

### Metrics not updating
**Cause:** Auto-refresh disabled or network error
**Fix:**
1. Enable auto-refresh checkbox
2. Manual refresh with "Atualizar" button
3. Check browser console for errors

### Agent score is 0
**Cause:** No tasks completed yet
**Fix:** Wait for tasks to be processed, or check approval workflow

### "Ativar NEXO" button greyed out
**Cause:** Not admin/head role
**Fix:** Contact admin to elevate your role

### Empty agent cards
**Cause:** No agents have generated tasks yet
**Fix:**
1. Click "Ativar NEXO" (if admin)
2. Wait for tasks to generate
3. Refresh dashboard

---

## 🔐 Permissions

| Feature | User | Admin/Head | QA |
|---------|------|-----------|-----|
| View Dashboard | ✅ | ✅ | ✅ |
| View Metrics | ✅ | ✅ | ✅ |
| Auto-Refresh | ✅ | ✅ | ✅ |
| Activate NEXO | ❌ | ✅ | ❌ |
| View Alerts | ❌ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ✅ |

---

## 🚀 Next Enhancements (Phase 3+)

### Planned Features

1. **WebSocket Real-time Updates**
   - Live metrics without polling
   - Instant notifications

2. **Task Execution Dashboard**
   - Track individual task status
   - Marketplace sync status
   - Completion timeline

3. **Advanced Alerting**
   - Slack notifications
   - Email alerts
   - SMS for critical issues
   - Custom alert rules

4. **Performance Charts**
   - Historical trends
   - Projection forecasts
   - Agent comparison graphs

5. **Manual Task Indication**
   - UI to indicate new tasks
   - Bulk operations
   - Channel-specific selection

6. **ML-based Insights**
   - Agent recommendations
   - Optimal channel assignment
   - Predictive performance

---

## 📱 Responsive Design

Dashboard is fully responsive:
- **Desktop:** 3-column agent grid
- **Tablet:** 2-column agent grid
- **Mobile:** 1-column agent grid

All metrics remain visible and clickable.

---

## 🎓 User Guide

**For Support Teams:**
1. Share the dashboard URL with stakeholders
2. Explain the color codes (green/yellow/red)
3. Point out bottleneck recommendations
4. Use reports for decision-making

**For Managers:**
1. Monitor daily via dashboard
2. Track agent performance trends
3. Review weekly reports
4. Plan resource allocation based on metrics

**For Developers:**
1. Use reports API for alerting systems
2. Hook dashboard data to BI tools
3. Integrate with monitoring stack
4. Build custom alerts on metrics

---

## 📞 Support

**Documentation:** `docs/NEXO-ORCHESTRATION-IMPLEMENTATION.md`
**Testing Guide:** `docs/NEXO-TESTING-GUIDE.md`
**API Reference:** `/api/marketplace/orchestration/*`

Dashboard is production-ready and can be accessed by all authenticated users immediately.

---

**Status:** Phase 2 ✅ Complete
**Next:** Phase 3 - Task Execution Tracking (2-3 weeks)
