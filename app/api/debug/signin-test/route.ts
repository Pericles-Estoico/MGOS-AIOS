import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Provider } from 'next-auth/providers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log('🧪 TEST: Attempting manual authorization test');

    // Find the credentials provider
    const credentialsProvider = authOptions.providers.find(
      (p: Provider) => (p as unknown as Record<string, unknown>).id === 'credentials'
    ) as unknown as Record<string, unknown>;

    if (!credentialsProvider) {
      return NextResponse.json({
        status: 'error',
        message: 'Credentials provider not found',
      }, { status: 400 });
    }

    console.log('🧪 TEST: Found credentials provider, calling authorize()');

    // Test the authorize function directly
    const user = await (credentialsProvider.authorize as (credentials: Record<string, unknown>, req: Record<string, unknown>) => Promise<Record<string, unknown> | null>)?.(
      { email, password },
      {}
    );

    console.log('🧪 TEST: Authorization result:', user);

    return NextResponse.json({
      status: 'ok',
      message: 'Manual auth test completed',
      input: { email, password },
      result: user || null,
      success: !!user,
    });
  } catch (error) {
    console.error('🧪 TEST ERROR:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
