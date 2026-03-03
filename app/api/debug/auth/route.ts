import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      status: 'OK',
      debug: {
        hasSession: !!session,
        sessionUser: session?.user?.email || null,
        sessionRole: (session?.user as any)?.role || null,
        nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        redisUrl: process.env.REDIS_URL ? 'configured' : 'missing',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'missing',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      testCredentials: {
        email: 'teste@teste.com',
        password: 'teste123',
      },
      message: 'Test login via browser - should use test user now',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        error: String(error),
      },
      { status: 500 }
    );
  }
}
