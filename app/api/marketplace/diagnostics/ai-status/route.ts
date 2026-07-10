import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  return Response.json({
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    defaultModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
  });
}
