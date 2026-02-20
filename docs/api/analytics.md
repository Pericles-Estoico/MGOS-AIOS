# Analytics API Documentation

**Story 3.6:** Analytics Data Aggregation Phase 2

## Overview

The Analytics API provides aggregated metrics for task completion, team productivity, and QA performance. Data is computed from audit logs with in-memory caching (5 minute TTL) for performance optimization.

### Base URL

```
GET /api/analytics/metrics
POST /api/analytics/metrics
```

## Authentication

All requests require a Bearer token in the Authorization header:

```bash
Authorization: Bearer {user-id}:{role}
```

**Roles:**
- `admin` - Full access to all metrics
- `head` - Team lead, access to team metrics
- `user` - Regular user, access to own metrics only
- `executor` - Task executor, access to own metrics only

## Endpoints

### GET /api/analytics/metrics

Retrieve analytics metrics for a date range.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `days` | integer | No | Number of days to include (1-365, default 30) | `?days=7` |
| `startDate` | ISO 8601 | No | Custom start date (overrides `days`) | `?startDate=2026-02-01T00:00:00Z` |
| `endDate` | ISO 8601 | No | Custom end date (required if `startDate` is used) | `?endDate=2026-02-28T23:59:59Z` |
| `userId` | UUID | No | Filter per-user metrics to specific user | `?userId=user-123` |
| `clearCache` | boolean | No | Invalidate cache (admin only) | `?clearCache=true` |

**Examples:**

```bash
# Last 7 days (default user)
curl -H "Authorization: Bearer user-123:user" \
  https://api.example.com/api/analytics/metrics?days=7

# Custom date range (admin)
curl -H "Authorization: Bearer admin-123:admin" \
  https://api.example.com/api/analytics/metrics?startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z

# Specific user metrics (admin accessing user data)
curl -H "Authorization: Bearer admin-123:admin" \
  https://api.example.com/api/analytics/metrics?days=30&userId=user-456

# Clear cache (admin only)
curl -H "Authorization: Bearer admin-123:admin" \
  https://api.example.com/api/analytics/metrics?clearCache=true
```

**Response Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid query parameters |
| 401 | Missing or invalid authorization |
| 403 | Insufficient permissions for requested resource |
| 500 | Server error |

**Success Response (200):**

```json
{
  "period": {
    "start": "2026-02-01T00:00:00.000Z",
    "end": "2026-02-28T23:59:59.999Z"
  },
  "perUserMetrics": [
    {
      "userId": "user-123",
      "displayName": "John Doe",
      "taskCount": 42,
      "avgCompletionTime": 8.5,
      "totalHours": 357,
      "approvalRate": 95.24,
      "rejectionRate": 4.76,
      "lastCompleted": "2026-02-28T15:30:00.000Z"
    }
  ],
  "teamMetrics": {
    "totalTasks": 250,
    "avgDailyCompletion": 8.93,
    "burndownTrend": [
      {
        "date": "2026-02-01",
        "tasksCompleted": 5
      },
      {
        "date": "2026-02-02",
        "tasksCompleted": 8
      }
    ],
    "teamAvgTime": 7.8,
    "overallSuccessRate": 92.4
  },
  "qaMetrics": {
    "avgReviewTime": 4.2,
    "pendingReviews": 12,
    "reviewSLA": 88.5
  }
}
```

### POST /api/analytics/metrics

Cache management endpoint (admin only).

**Request Body:**

```json
{
  "action": "invalidate"
}
```

**Actions:**

| Action | Description | Permission |
|--------|-------------|------------|
| `invalidate` | Clear all cached metrics | admin, head |

**Success Response (200):**

```json
{
  "message": "Analytics cache invalidated successfully"
}
```

**Error Response (403):**

```json
{
  "error": "Unauthorized: Only admins can invalidate cache"
}
```

## Response Fields

### Per-User Metrics

| Field | Type | Description |
|-------|------|-------------|
| `userId` | UUID | User identifier |
| `displayName` | string | User display name |
| `taskCount` | integer | Total tasks completed in period |
| `avgCompletionTime` | number | Average duration from created to approved (hours) |
| `totalHours` | number | Sum of all task durations (hours) |
| `approvalRate` | number | Percentage of approved tasks (0-100) |
| `rejectionRate` | number | Percentage of rejected tasks (0-100) |
| `lastCompleted` | ISO 8601 | Date of most recent completed task |

### Team Metrics

| Field | Type | Description |
|-------|------|-------------|
| `totalTasks` | integer | Total tasks completed in period |
| `avgDailyCompletion` | number | Average tasks per day |
| `burndownTrend` | array | Daily completion trend [{date, tasksCompleted}] |
| `teamAvgTime` | number | Average completion time across all users (hours) |
| `overallSuccessRate` | number | Percentage of approved tasks across team (0-100) |

### QA Metrics

| Field | Type | Description |
|-------|------|-------------|
| `avgReviewTime` | number | Average time from submitted to approved/rejected (hours) |
| `pendingReviews` | integer | Count of tasks waiting for QA review |
| `reviewSLA` | number | Percentage of reviews completed within 24 hours (0-100) |

## Authorization Rules

### Team Metrics Access

Only `admin` and `head` roles can access:
- `teamMetrics` object
- `qaMetrics` object

Regular users receive empty/zero values for these fields.

### User Metrics Access

- **Own metrics:** All users can access their own metrics
- **Other user metrics:** Only `admin` and `head` can access other users' metrics

Attempting to access another user's metrics without proper authorization returns 403 Forbidden.

## Performance Characteristics

- **Caching:** 5-minute TTL on all metrics
- **Target latency:** < 2 seconds for 30-day date range
- **Query optimization:**
  - Indexes on `(status, user_id, created_at)`
  - RPC functions for aggregations
  - SQL GROUP BY on date ranges

## Pagination

Metrics are aggregated for the entire date range. Pagination is not supported at this time.

## Data Sources

Metrics are computed from:
- `audit_logs` - Task status transitions and timestamps
- `user_profiles` - User display names
- All data is 5-10 minutes stale due to caching

## Usage Examples

### Dashboard User Viewing Their Own Metrics

```bash
curl -X GET \
  "https://api.example.com/api/analytics/metrics?days=30" \
  -H "Authorization: Bearer user-123:user"
```

Returns only `perUserMetrics` for user-123, with empty team/QA metrics.

### Admin Viewing Team Dashboard

```bash
curl -X GET \
  "https://api.example.com/api/analytics/metrics?days=30" \
  -H "Authorization: Bearer admin-123:admin"
```

Returns complete analytics with `perUserMetrics`, `teamMetrics`, and `qaMetrics`.

### Head Lead Checking Specific User Progress

```bash
curl -X GET \
  "https://api.example.com/api/analytics/metrics?days=7&userId=user-456" \
  -H "Authorization: Bearer head-789:head"
```

Returns metrics for user-456 (accessible because requester is head).

### Invalidating Cache After Bulk Task Import

```bash
curl -X POST \
  "https://api.example.com/api/analytics/metrics" \
  -H "Authorization: Bearer admin-123:admin" \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidate"}'
```

Clears cache so next request gets fresh data.

## Error Handling

### Invalid Date Range

**Request:**
```bash
curl -X GET \
  "https://api.example.com/api/analytics/metrics?days=400" \
  -H "Authorization: Bearer user-123:user"
```

**Response (400):**
```json
{
  "error": "days must be between 1 and 365"
}
```

### Missing Authorization

**Request:**
```bash
curl -X GET "https://api.example.com/api/analytics/metrics?days=30"
```

**Response (401):**
```json
{
  "error": "Missing or invalid Authorization header"
}
```

### Insufficient Permissions

**Request (user accessing other user's data):**
```bash
curl -X GET \
  "https://api.example.com/api/analytics/metrics?days=30&userId=user-999" \
  -H "Authorization: Bearer user-123:user"
```

**Response (403):**
```json
{
  "error": "Unauthorized: Cannot access other users metrics"
}
```

## Roadmap

Future enhancements (out of scope for Story 3.6):

- [ ] Pagination for large datasets
- [ ] Custom metric definitions
- [ ] Real-time streaming analytics
- [ ] Email report generation
- [ ] Data export (CSV, JSON)
- [ ] Machine learning predictions (burndown forecasting)

## References

- Story 3.6: Analytics Data Aggregation Phase 2
- Story 3.7: Analytics Dashboard UI (depends on this API)
- Epic 2: Task Management System (data source)
- Story 3.2: User Management (user context)
