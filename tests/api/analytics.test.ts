/**
 * Analytics API Integration Tests
 * Story 3.6: Analytics Data Aggregation Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, OPTIONS } from '@/app/api/analytics/metrics/route';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
  })),
}));

describe('Analytics Metrics API', () => {
  const baseUrl = 'http://localhost:3000/api/analytics/metrics';
  const adminToken = 'admin-user-123:admin';
  const userToken = 'user-456:user';
  const headToken = 'head-user-789:head';

  // ========================================================================
  // Authorization Tests
  // ========================================================================

  describe('GET /api/analytics/metrics - Authorization', () => {
    it('should reject missing Authorization header', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'GET',
        headers: new Headers(),
      });

      const res = await GET(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toContain('Authorization');
    });

    it('should reject invalid Bearer token format', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'GET',
        headers: new Headers({
          Authorization: 'Basic dXNlcjpwYXNz',
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should accept valid Bearer token (admin)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should accept valid Bearer token (user)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${userToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // Query Parameter Validation Tests
  // ========================================================================

  describe('GET /api/analytics/metrics - Query Validation', () => {
    const authHeader = new Headers({
      Authorization: `Bearer ${adminToken}`,
    });

    it('should accept days parameter (7)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7`), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should accept days parameter (30)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=30`), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should reject invalid days (> 365)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=400`), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('days');
    });

    it('should reject invalid days (0)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=0`), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('should reject invalid days (non-numeric)', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=invalid`), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('should accept custom date range', async () => {
      const start = '2026-02-01T00:00:00Z';
      const end = '2026-02-28T23:59:59Z';
      const req = new NextRequest(
        new URL(`${baseUrl}?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`),
        {
          method: 'GET',
          headers: authHeader,
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should reject invalid date format', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?startDate=2026-13-45`), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('ISO 8601');
    });

    it('should reject start date > end date', async () => {
      const start = '2026-02-28T00:00:00Z';
      const end = '2026-02-01T00:00:00Z';
      const req = new NextRequest(
        new URL(`${baseUrl}?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`),
        {
          method: 'GET',
          headers: authHeader,
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('before');
    });

    it('should default to 30 days if no range specified', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'GET',
        headers: authHeader,
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.period).toBeDefined();
    });
  });

  // ========================================================================
  // User Metrics Access Tests
  // ========================================================================

  describe('GET /api/analytics/metrics - User Access Control', () => {
    it('should allow user to access own metrics', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7&userId=user-456`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${userToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should deny user accessing other user metrics', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7&userId=user-999`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${userToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toContain('Unauthorized');
    });

    it('should allow admin to access any user metrics', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7&userId=user-999`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });

    it('should allow head to access any user metrics', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7&userId=user-999`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${headToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // Team Metrics Access Tests
  // ========================================================================

  describe('GET /api/analytics/metrics - Team Metrics Access', () => {
    it('should return empty team metrics for regular user', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=30`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${userToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.teamMetrics).toBeDefined();
      expect(body.teamMetrics.totalTasks).toBe(0);
      expect(body.qaMetrics.avgReviewTime).toBe(0);
    });

    it('should return team metrics for admin', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=30`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.teamMetrics).toBeDefined();
      expect(body.qaMetrics).toBeDefined();
    });

    it('should return team metrics for head', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=30`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${headToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.teamMetrics).toBeDefined();
      expect(body.qaMetrics).toBeDefined();
    });
  });

  // ========================================================================
  // Cache Invalidation Tests
  // ========================================================================

  describe('POST /api/analytics/metrics - Cache Management', () => {
    it('should allow admin to invalidate cache', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'invalidate' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.message).toContain('invalidated');
    });

    it('should deny regular user cache invalidation', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'invalidate' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toContain('Unauthorized');
    });

    it('should reject invalid action in POST', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'invalid' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('Invalid action');
    });
  });

  // ========================================================================
  // Response Structure Tests
  // ========================================================================

  describe('GET /api/analytics/metrics - Response Structure', () => {
    it('should return valid analytics response', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=30`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
        }),
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('period');
      expect(body).toHaveProperty('perUserMetrics');
      expect(body).toHaveProperty('teamMetrics');
      expect(body).toHaveProperty('qaMetrics');
    });

    it('should include period with start and end dates', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=7`), {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
        }),
      });

      const res = await GET(req);
      const body = await res.json();

      expect(body.period).toHaveProperty('start');
      expect(body.period).toHaveProperty('end');
      expect(new Date(body.period.start)).toBeInstanceOf(Date);
      expect(new Date(body.period.end)).toBeInstanceOf(Date);
    });
  });

  // ========================================================================
  // CORS Tests
  // ========================================================================

  describe('OPTIONS /api/analytics/metrics - CORS', () => {
    it('should return 200 for OPTIONS request', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'OPTIONS',
      });

      const res = await OPTIONS(req);
      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // Error Handling Tests
  // ========================================================================

  describe('GET /api/analytics/metrics - Error Handling', () => {
    it('should handle missing Authorization header gracefully', async () => {
      const req = new NextRequest(new URL(`${baseUrl}?days=30`), {
        method: 'GET',
        headers: new Headers(),
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      expect(res.headers.get('content-type')).toContain('application/json');
    });

    it('should handle malformed request body in POST', async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        }),
        body: 'invalid json',
      });

      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
