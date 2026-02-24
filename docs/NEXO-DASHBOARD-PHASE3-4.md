# NEXO Marketplace Orchestration - Phase 3 & 4: Execution Tracking + Advanced Optimization

**Data:** 2026-02-24
**Status:** ✅ **COMPLETE** - Full Phase 3-4 implementation
**Phase:** v3-4 - Task Execution Tracking & ML-based Optimization
**Commit:** b963255

---

## 🎯 What's New in Phase 3 & 4

### Phase 3: Real-time Task Execution Tracking
✨ **Features Added:**
1. **Live Task Execution Dashboard** - Real-time progress monitoring for all tasks
2. **Progress Calculation** - Automatic progress (0-100%) based on task status
3. **Marketplace Sync Tracking** - Per-channel synchronization status
4. **Time Tracking** - Compare actual vs estimated execution time
5. **Comprehensive Filtering** - By status (pending/in_progress/completed/failed) + channel
6. **Summary Statistics** - Real-time task counts and total progress percentage
7. **Auto-refresh** - Updates every 5 seconds with toggle

### Phase 4: Advanced Optimization (ML-based Routing & Adaptive Weighting)
✨ **Features Added:**
1. **ML-based Agent Routing** - Recommend best agent for each task type/channel
2. **Adaptive Performance Weighting** - Dynamically adjust formula weights based on variance
3. **Predictive Analytics** - Forecast agent performance using linear regression
4. **Recommended Actions** - Scale workload, maintain, reduce, or retrain per agent
5. **Intelligent Specialization Scoring** - Bonus for task-agent specialization match
6. **Error Rate Penalty** - Penalize agents with high error rates
7. **Trend Visualization** - Arrow indicators showing performance direction
8. **30-day Historical Analysis** - Base predictions on full 30-day window

---

## 📍 Dashboard Locations

**Phase 3 - Task Execution:**
```
URL: https://www.sellerops.com.br/marketplace/tasks/execution
Access: Any authenticated user
```

**Phase 4 - Advanced Optimization:**
```
URL: https://www.sellerops.com.br/marketplace/orchestration/optimization
Access: Admin/Head/QA roles (optimization endpoints restricted)
```

---

## 🎨 Phase 3: Task Execution Dashboard

### Components

#### 1. Header Section
- Title "📊 Execução de Tarefas" + subtitle
- **Refresh Button** - Manual update
- Real-time update indicator

#### 2. Summary Cards (5)
Shows live counts:
- 🔵 **Aguardando** - Tasks in pending status
- 🟦 **Em Progresso** - Tasks currently running
- 🟩 **Concluído** - Successfully completed tasks
- 🟥 **Falha** - Failed or cancelled tasks
- 🟣 **Progresso Total** - Overall system progress %

#### 3. Status Filters
Clickable buttons: `Todas` | `Aguardando` | `Em Progresso` | `Concluído` | `Falha`

#### 4. Channel Filters
All 6 channels: `Todos` | `Amazon` | `MercadoLivre` | `Shopee` | `Shein` | `TikTok Shop` | `Kaway`

#### 5. Task List (Per Task)
```
┌─────────────────────────────────────────┐
│ ✓ TASK-ID (Icons showing status)        │
│ AMAZON • agent-id (Channel + Agent)     │ 100% Done
├─────────────────────────────────────────┤
│ Progress: ████████████░ 87% completed  │
├─────────────────────────────────────────┤
│ ⏱️ 45min / 60min (Time tracking)        │
│ Iniciado: 14:30:25                      │
│ Concluído: 15:15:42                     │
├─────────────────────────────────────────┤
│ Sincronização Marketplace:              │
│ amazon: ✓  mercadolivre: ○  shopee: ○ │
│ shein: ✓  tiktokshop: ✓  kaway: ○     │
└─────────────────────────────────────────┘
```

**Color Coding:**
- 🟩 Green (Completed) - 100% progress
- 🟦 Blue (In Progress) - 50% progress
- 🟨 Yellow (Marketplace Sync) - 25% progress
- 🟥 Red (Failed) - 0% progress
- ⚪ Gray (Pending) - 0% progress

### Task Status Progression

```
pending
    ↓
in_progress (25% → 50%)
    ↓
marketplace_sync (50% → 75%)
    ↓
completed (→ 100%)
    ↓
[OR]
    ↓
failed
```

### Progress Calculation

| Task Status | Progress % | Meaning |
|-------------|-----------|---------|
| pending | 0% | Waiting to start |
| in_progress | 50% | Agent is executing |
| marketplace_sync | 75% | Syncing to marketplaces |
| completed | 100% | Successfully finished |
| failed | 0% | Error encountered |

### Time Tracking

- **Time Spent:** Calculated from `created_at` to now
- **Time Estimate:** From `estimated_hours * 60`
- **Format:** "45min / 60min" or "2h 30min / 3h"

---

## 🎨 Phase 4: Advanced Optimization Dashboard

### Components

#### 1. Header Section
- Title "🧠 Otimização Avançada NEXO"
- Subtitle "ML-based routing & adaptive weighting"
- Refresh button

#### 2. Summary Cards (4)
- 🟣 **Performance Média Prevista** - Average predicted score for next period
- 🟩 **Pronto para Escalar** - Count of agents with score ≥80
- 🟥 **Precisam Retreinar** - Count of agents with score <50
- 🟦 **Total Otimizado** - Total agents analyzed (always 6)

#### 3. Agent Optimization Cards (6 - One per agent)
```
┌───────────────────────────────────────────┐
│ Agent Name              Score: 78/100    │ Current
├───────────────────────────────────────────┤
│ Performance Prevista                      │
│ ↗️ 82% (prediction with trend)           │
│ ████████░ 82% (progress bar)              │
├───────────────────────────────────────────┤
│ Pesos Adaptativos:                        │
│ Taxa Aprovação: 55% ███░░░░              │
│ Taxa Conclusão: 25% ██░░░░░░░            │
│ Tempo Execução: 20% ██░░░░░░░            │
├───────────────────────────────────────────┤
│ 📈 Aumentar Workload                      │ Recommended
│ 2026-02-24 14:35:12                       │ Timestamp
└───────────────────────────────────────────┘
```

**Color Coding by Recommended Action:**
- 🟩 Green (Increase Workload) - Score ≥80, trending up
- 🟦 Blue (Maintain) - Score 70-79, stable
- 🟨 Yellow (Reduce Workload) - Score 60-69, needs help
- 🟥 Red (Retrain) - Score <50, critical

#### 4. Information Box
Explains ML optimization:
- Adaptive weights adjust based on historical variance
- Predictions use 30-day history
- Recommendations based on trends

---

## 🔧 Technical Implementation

### Phase 3 - Task Execution API

**Endpoint:** `GET/PATCH /api/marketplace/orchestration/task-execution`

**GET Query Parameters:**
- `limit` (default: 50) - Max tasks to return
- `taskId` (optional) - Filter specific task
- `status` (optional) - Filter by status
- `channel` (optional) - Filter by channel

**GET Response:**
```json
{
  "status": "success",
  "timestamp": "2026-02-24T14:35:12Z",
  "totalTasks": 42,
  "tasks": [
    {
      "taskId": "task-uuid-123",
      "status": "in_progress",
      "progress": 50,
      "startedAt": "2026-02-24T14:30:00Z",
      "completedAt": null,
      "marketplace": "amazon",
      "channel": "amazon",
      "agentId": "alex",
      "timeEstimate": 60,
      "timeSpent": 45,
      "lastUpdate": "2026-02-24T14:35:12Z",
      "syncStatus": {
        "amazon": true,
        "mercadolivre": false,
        "shopee": false,
        "shein": true,
        "tiktokshop": false,
        "kaway": false
      },
      "error": null
    }
  ],
  "summary": {
    "pending": 8,
    "inProgress": 12,
    "completed": 20,
    "failed": 2,
    "totalProgress": 65
  }
}
```

**PATCH Request Body:**
```json
{
  "taskId": "task-uuid-123",
  "status": "marketplace_sync",
  "progress": 75
}
```

**PATCH Response:**
```json
{
  "status": "success",
  "message": "Task execution updated",
  "task": { ... updated task data ... },
  "timestamp": "2026-02-24T14:35:12Z"
}
```

### Phase 4 - Optimization API

#### GET - Fetch Optimization Metrics

**Endpoint:** `GET /api/marketplace/orchestration/optimization`

**Response:**
```json
{
  "status": "success",
  "timestamp": "2026-02-24T14:35:12Z",
  "optimizations": [
    {
      "agentId": "alex",
      "agentName": "Alex",
      "baseScore": 78,
      "adaptiveWeights": {
        "approvalRate": 0.60,
        "completionRate": 0.30,
        "executionTime": 0.10
      },
      "predictedPerformance": 82,
      "recommendedAction": "increase_workload",
      "lastOptimization": "2026-02-24T14:35:12Z"
    }
    // ... 5 more agents ...
  ],
  "summary": {
    "agentsNeedingRetraining": 1,
    "agentsReadyToScale": 2,
    "averagePredictedPerformance": 76
  }
}
```

#### POST - ML-based Routing Recommendation

**Endpoint:** `POST /api/marketplace/orchestration/optimization/recommend`

**Request:**
```json
{
  "taskType": "listing_optimization",
  "channel": "amazon"
}
```

**Response:**
```json
{
  "status": "success",
  "recommendation": {
    "taskType": "listing_optimization",
    "channel": "amazon",
    "recommendedAgentId": "alex",
    "alternativeAgents": [
      {
        "agentId": "marina",
        "score": 72,
        "reason": "Desempenho geral"
      },
      {
        "agentId": "sunny",
        "score": 65,
        "reason": "Especialista em listing_optimization"
      }
    ],
    "confidence": 89,
    "expectedSuccessRate": 74
  },
  "timestamp": "2026-02-24T14:35:12Z"
}
```

**Routing Algorithm:**
1. Fetch all agents for channel
2. Calculate scores based on:
   - Base performance score (0-100)
   - +10 bonus for task specialization
   - -15 penalty if approval_rate < 70%
   - -20 penalty if error_rate > 10%
3. Sort by score descending
4. Return top agent + 2 alternatives
5. Calculate confidence as (score / 100) * 100
6. Expected success rate = score * 0.95

#### PATCH - Update Adaptive Weights

**Endpoint:** `PATCH /api/marketplace/orchestration/optimization/weights`

**Request:**
```json
{
  "agentId": "alex",
  "weights": {
    "approvalRate": 0.55,
    "completionRate": 0.35,
    "executionTime": 0.10
  }
}
```

**Validation:**
- Sum of weights must equal 1.0 (±0.05 tolerance)
- Each weight must be 0-1
- Returns 400 if invalid

---

## 📊 Adaptive Weight Calculation

**Algorithm:**

1. **Calculate Historical Variance** for each metric
   ```
   variance(metric) = Σ(value - mean)² / n
   ```

2. **Determine Metric Reliability** (inverse of variance)
   - Low variance = reliable metric = keep weight
   - High variance = unreliable metric = lower weight

3. **Adjust Based on Current Performance**
   ```
   IF avgCompletion < 60%:
     approvalRate weight: 0.5 → 0.6 (emphasize)
     completionRate weight: 0.3 → 0.4 (emphasize)
     executionTime weight: 0.2 → 0.1 (de-emphasize)
   ```

4. **Normalize to Sum = 1.0**
   ```
   normalizedWeight = weight / Σ(all weights)
   ```

**Example:**
```
Agent Marina - Low Completion Rate
- Base weights: approval=0.5, completion=0.3, execution=0.2
- Historical avg completion: 45%
- Adjusted: approval=0.6, completion=0.4, execution=0.1
- Normalized: approval=0.54, completion=0.36, execution=0.09
- Result: Completion rate now impacts score more heavily
```

---

## 📈 Predictive Performance Calculation

**Method:** Linear Regression on 30-day history

**Algorithm:**
```
Given 30 data points (x=day, y=performance_score):

Slope = (n * ΣXY - ΣX * ΣY) / (n * ΣX² - ΣX²)
Intercept = (ΣY - slope * ΣX) / n
Prediction(next) = slope * (n+1) + intercept
```

**Clamped Result:** max(0, min(100, predicted_score))

**Trend Arrows:**
- ↗️ (Up): Prediction > Current + 5
- ↘️ (Down): Prediction < Current - 5
- → (Stable): Between -5 and +5

---

## 🎮 Recommended Actions Engine

| Current Score | Trend | Recommended Action | Meaning |
|---|---|---|---|
| ≥80 | Trending Up | increase_workload | Agent is performing well, assign more |
| 70-79 | Any | maintain | Agent is stable, keep current load |
| 60-69 | Any | reduce_workload | Agent needs help, reduce assignments |
| <50 | Any | retrain | Agent is critical, needs retraining |

**Implementation:**
```typescript
IF currentScore >= 80 AND trend > 0:
  return 'increase_workload'
ELSE IF currentScore >= 60 AND currentScore < 70:
  return 'reduce_workload'
ELSE IF currentScore < 50:
  return 'retrain'
ELSE:
  return 'maintain'
```

---

## 🔐 Permissions

| Feature | User | Admin/Head | QA |
|---------|------|-----------|--------|
| View Task Execution | ✅ | ✅ | ✅ |
| Filter Tasks | ✅ | ✅ | ✅ |
| Update Task Status | ❌ | ✅ | ❌ |
| View Optimizations | ❌ | ✅ | ✅ |
| Get Routing Recommendation | ❌ | ✅ | ✅ |
| Update Adaptive Weights | ❌ | ✅ | ❌ |

---

## 🚀 Next Enhancements (Phase 5+)

### Phase 5: Marketplace API Integration
- [ ] Direct API calls to marketplace platforms
- [ ] Real-time sync status updates
- [ ] Bi-directional data flow
- [ ] Webhook handlers for marketplace events

### Phase 6: Advanced ML Features
- [ ] Neural network-based performance prediction
- [ ] Agent specialization learning
- [ ] Anomaly detection (sudden performance drops)
- [ ] Reinforcement learning for weight optimization

### Phase 7: Alerting & Notifications
- [ ] Slack integration for critical alerts
- [ ] Email reports (daily/weekly)
- [ ] SMS for SLA breaches
- [ ] Custom alert rules per user

### Phase 8: Historical Analytics
- [ ] Performance trends visualization
- [ ] Channel comparison reports
- [ ] Agent comparison reports
- [ ] ROI analysis per agent-channel pair

---

## 📊 Key Metrics Explained

### Progress Percentage
```
0%   = pending (not started)
25%  = approved (ready to run)
50%  = in_progress (agent executing)
75%  = marketplace_sync (sending to platforms)
100% = completed (finished)
```

### Performance Score
```
Formula: (approvalRate × weight₁) + (completionRate × weight₂) + (executionTime × weight₃)

80-100 = ✅ Excellent (can increase workload)
70-79  = ✅ Good (maintain current load)
60-69  = ⚠️ Fair (reduce workload, monitor)
<60    = ❌ Critical (needs retraining/intervention)
```

### Adaptive Weights
```
Sum must = 1.0
Higher weight = more impact on final score
Adjusted based on 30-day historical variance
Lower variance = higher weight = more reliable metric
```

### Prediction Confidence
```
Confidence = (agentScore / 100) × 100
Range: 0-100%

>80% = High confidence in prediction
60-80% = Moderate confidence
<60% = Low confidence (limited data)
```

---

## 🐛 Troubleshooting

### Task Execution shows empty
**Cause:** No tasks in database yet
**Fix:** Run orchestration activation first (Phase 2 - "Ativar NEXO" button)

### Progress stuck at 50%
**Cause:** Task is in_progress but hasn't synced to marketplace yet
**Fix:** Check agent logs for sync errors, manually trigger sync via admin endpoint

### Optimization showing all "maintain"
**Cause:** All agents have stable performance (60-79 range)
**Fix:** This is normal! Scores between 70-79 are good. Wait for variance.

### Predictions all negative (↘️)
**Cause:** Last 30 days show declining trend
**Fix:** Investigate agent issues, consider retraining, check marketplace changes

### Can't see optimization page
**Cause:** Not admin/head/qa role
**Fix:** Contact admin to elevate role

---

## 📞 Support

**Documentation:** `docs/NEXO-DASHBOARD-PHASE2.md` (Phase 2)
**API Reference:** `/api/marketplace/orchestration/*`
**Testing Guide:** `docs/NEXO-TESTING-GUIDE.md`

Phases 3-4 are production-ready and fully integrated with existing dashboard.

---

## 🎓 User Guide

### For Support Teams
1. Monitor `/marketplace/tasks/execution` for real-time status
2. Check for high failure rates (red cards)
3. Use filters to debug specific channels
4. Share progress % with stakeholders

### For Managers
1. Check `/marketplace/orchestration/optimization` daily
2. Review agents marked "retrain" (red cards)
3. Track predicted performance trends
4. Plan resource allocation based on recommendations

### For Developers
1. Use optimization API for agent routing in new features
2. Hook task-execution data to monitoring stacks
3. Integrate routing recommendations into task assignment
4. Monitor adaptive weights changes for tuning insights

---

**Status:** Phase 3-4 ✅ Complete
**Next:** Phase 5 - Marketplace API Integration (2-3 weeks)

