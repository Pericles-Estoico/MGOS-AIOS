/**
 * Simple credentials test - bypasses NextAuth to test if credentials matching works
 */

// Test users - copied directly from lib/auth.ts
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

  const results = {
    test: {
      email: testEmail,
      password: testPassword,
    },
    testUsersCount: TEST_USERS.length,
    testUsersList: TEST_USERS.map(u => ({ email: u.email, password: u.password })),
    emailMatches: [] as any[],
    passwordMatches: [] as any[],
    fullMatches: [] as any[],
  };

  // Test email matches
  TEST_USERS.forEach((u) => {
    if (u.email === testEmail) {
      results.emailMatches.push({
        email: u.email,
        providedEmail: testEmail,
        match: true,
      });
    }
  });

  // Test password matches
  TEST_USERS.forEach((u) => {
    if (u.password === testPassword) {
      results.passwordMatches.push({
        password: u.password,
        providedPassword: testPassword,
        match: true,
      });
    }
  });

  // Test full matches
  TEST_USERS.forEach((u) => {
    const emailMatch = u.email === testEmail;
    const passwordMatch = u.password === testPassword;
    if (emailMatch && passwordMatch) {
      results.fullMatches.push({
        email: u.email,
        password: u.password,
        role: u.role,
        match: true,
      });
    }
  });

  // Alternative: find with direct logic
  const foundUser = TEST_USERS.find(
    (u) => u.email === testEmail && u.password === testPassword
  );

  return Response.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    results,
    foundUser: foundUser ? { email: foundUser.email, role: foundUser.role, id: foundUser.id } : null,
    directMatch: foundUser ? 'YES - User found!' : 'NO - No user found',
  });
}
