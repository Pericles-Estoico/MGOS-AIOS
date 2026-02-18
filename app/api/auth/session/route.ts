import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return session (useful for debugging and testing)
    return NextResponse.json({
      user: {
        id: session.user?.id,
        email: session.user?.email,
        role: session.user?.role,
        name: session.user?.name,
      },
      accessToken: session.accessToken ? '***' : undefined, // Don't expose token
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
