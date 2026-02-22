import { authOptions } from '@/lib/auth-mock';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 DEBUG: Checking NextAuth configuration...');
    console.log('🧪 DEBUG: NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('🧪 DEBUG: NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

    const session = await getServerSession(authOptions);
    console.log('🧪 DEBUG: Current session:', session);

    return NextResponse.json({
      status: 'ok',
      message: 'NextAuth debug endpoint working',
      environment: {
        nextAuthSecretConfigured: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      currentSession: session,
      authOptions: {
        providers: (authOptions.providers as unknown as Array<Record<string, unknown>>).map((p: Record<string, unknown>) => p.id || p.name),
        pages: authOptions.pages,
        hasCallbacks: !!authOptions.callbacks,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('🧪 DEBUG ERROR:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
