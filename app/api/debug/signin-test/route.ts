import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-mock';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log('🧪 TEST: Attempting manual authorization test');

    // Find the credentials provider
    const credentialsProvider = (authOptions.providers as unknown[]).find(
      (p: unknown) => (p as Record<string, unknown>).id === 'credentials'
    ) as Record<string, unknown> | undefined;

    if (!credentialsProvider) {
      return NextResponse.json({
        status: 'error',
        message: 'Credentials provider not found',
      }, { status: 400 });
    }

    console.log('🧪 TEST: Found credentials provider, calling authorize()');

    // Test the authorize function directly
    const authorize = credentialsProvider.authorize as (credentials: Record<string, unknown>, req: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    const user = await authorize?.(
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
