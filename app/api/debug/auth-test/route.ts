import { authOptions } from '@lib/auth';

// Test users definition (must match lib/auth.ts)
const TEST_USERS = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'admin@empresa.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '20000000-0000-0000-0000-000000000001',
    email: 'maria@empresa.com',
    password: 'maria123',
    name: 'Maria Silva',
    role: 'head',
  },
  {
    id: '30000000-0000-0000-0000-000000000001',
    email: 'joao@empresa.com',
    password: 'joao123',
    name: 'João Oliveira',
    role: 'executor',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'teste@teste.com',
    password: 'teste123',
    name: 'Teste User',
    role: 'executor',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'pericles@vidadeceo.com.br',
    password: 'Estoico123@',
    name: 'Pericles',
    role: 'admin',
  },
];

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const testEmail = searchParams.get('email') || 'teste@teste.com';
  const testPassword = searchParams.get('password') || 'teste123';

  const debugLog: string[] = [];
  debugLog.push(`[Debug] Testing credentials: ${testEmail} / ${testPassword}`);
  debugLog.push(`[Debug] TEST_USERS count: ${TEST_USERS.length}`);
  debugLog.push(`[Debug] Available test users:`);

  TEST_USERS.forEach((u, idx) => {
    debugLog.push(`  ${idx + 1}. ${u.email} (pwd: ${u.password})`);
  });

  try {
    // Test direct comparison
    debugLog.push(`\n[Direct Comparison Test]`);
    const directMatch = TEST_USERS.find(
      (u) => u.email === testEmail && u.password === testPassword
    );
    debugLog.push(`Direct match result: ${directMatch ? 'FOUND' : 'NOT FOUND'}`);
    if (directMatch) {
      debugLog.push(`Matched user: ${directMatch.email} (role: ${directMatch.role})`);
    }

    // Get the credentials provider
    debugLog.push(`\n[NextAuth Provider Test]`);
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === 'credentials'
    );

    if (!credentialsProvider) {
      debugLog.push('❌ Credentials provider not found');
      return Response.json({
        status: 'Test executed',
        error: 'Credentials provider not found',
        debug: debugLog,
      });
    }

    debugLog.push('✅ Credentials provider found');

    // Test with authorize function
    debugLog.push(`\n[Calling authorize() function]`);
    const result = await (credentialsProvider as any).authorize?.({
      email: testEmail,
      password: testPassword,
    }, {} as any);

    debugLog.push(`authorize() returned: ${result ? 'USER OBJECT' : 'null'}`);
    if (result) {
      debugLog.push(`User: ${result.email}, Role: ${result.role}`);
    }

    // Also check environment
    debugLog.push(`\n[Environment Check]`);
    debugLog.push(`NODE_ENV: ${process.env.NODE_ENV}`);
    debugLog.push(`Has NEXTAUTH_SECRET: ${!!process.env.NEXTAUTH_SECRET}`);
    debugLog.push(`Has SUPABASE_URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);

    return Response.json({
      status: 'Test executed',
      testEmail,
      testPassword,
      directMatch: directMatch ? { email: directMatch.email, role: directMatch.role } : null,
      authResult: result ? { email: result.email, role: result.role } : null,
      debug: debugLog,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    debugLog.push(`\n[ERROR] ${error.message}`);
    return Response.json({
      error: error.message,
      stack: error.stack,
      debug: debugLog,
    });
  }
}
