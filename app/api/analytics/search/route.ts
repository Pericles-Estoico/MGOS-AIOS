import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view search analytics
    if (!['admin', 'head'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || '7'; // days
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createSupabaseServerClient(session.accessToken);

    // Get date range
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(timeRange));

    // Top searches
    const { data: topSearches } = await supabase
      .from('search_analytics')
      .select('search_query, result_count, created_at', { count: 'exact' })
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    // Aggregate top searches
    const searchStats: Record<string, { count: number; avgResults: number }> = {};
    (topSearches || []).forEach((search: any) => {
      if (!searchStats[search.search_query]) {
        searchStats[search.search_query] = { count: 0, avgResults: 0 };
      }
      searchStats[search.search_query].count += 1;
      searchStats[search.search_query].avgResults += search.result_count || 0;
    });

    const topSearchesList = Object.entries(searchStats)
      .map(([query, stats]) => ({
        query,
        searches: stats.count,
        avgResults: Math.round(stats.avgResults / stats.count),
      }))
      .sort((a, b) => b.searches - a.searches)
      .slice(0, limit);

    // Search performance stats
    const { data: perfStats } = await supabase
      .from('search_analytics')
      .select('execution_time_ms')
      .gte('created_at', fromDate.toISOString());

    const times = (perfStats || []).map((s: any) => s.execution_time_ms || 0);
    const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0;
    const maxTime = times.length > 0 ? Math.max(...times) : 0;

    // Most used filters
    const { data: filterStats } = await supabase
      .from('search_analytics')
      .select('filters')
      .gte('created_at', fromDate.toISOString())
      .not('filters', 'is', null);

    const filterUsage: Record<string, number> = {};
    (filterStats || []).forEach((stat: any) => {
      if (stat.filters) {
        Object.keys(stat.filters).forEach((key) => {
          if (stat.filters[key]) {
            filterUsage[key] = (filterUsage[key] || 0) + 1;
          }
        });
      }
    });

    const topFilters = Object.entries(filterUsage)
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Total search volume
    const { count: totalSearches } = await supabase
      .from('search_analytics')
      .select('*', { count: 'exact' })
      .gte('created_at', fromDate.toISOString());

    return Response.json({
      data: {
        period: `Last ${timeRange} days`,
        totalSearches: totalSearches || 0,
        avgSearchTime: avgTime,
        maxSearchTime: maxTime,
        topSearches: topSearchesList,
        topFilters: topFilters,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
