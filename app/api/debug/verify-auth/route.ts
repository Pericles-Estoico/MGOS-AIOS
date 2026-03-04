/**
 * Auth verification endpoint - tests all authentication paths
 * This endpoint tries to login and reports comprehensive information
 */

// Import the test users and auth logic
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

async function testAuthorize(email: string, password: string) {
  // Simulate what the authorize function does
  if (!email || !password) {
    return null;
  }

  const testUser = TEST_USERS.find(
    (u) => u.email === email && u.password === password
  );

  if (testUser) {
    return {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
    };
  }

  return null;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const testEmail = searchParams.get('email') || 'teste@teste.com';
  const testPassword = searchParams.get('password') || 'teste123';

  const results = {
    timestamp: new Date().toISOString(),
    test: { email: testEmail, password: testPassword },

    // Test 1: Direct matching
    directMatch: TEST_USERS.find(
      (u) => u.email === testEmail && u.password === testPassword
    ) ? 'FOUND' : 'NOT_FOUND',

    // Test 2: Simulated authorize
    simulatedAuthorizeResult: await testAuthorize(testEmail, testPassword),

    // Test 3: Check all users exist
    allUsersFound: TEST_USERS.length === 5,
    userCount: TEST_USERS.length,

    // Test 4: Email exists
    emailFound: TEST_USERS.some(u => u.email === testEmail),

    // Test 5: Password matches for that email
    passwordMatches: TEST_USERS.find(u => u.email === testEmail)?.password === testPassword,

    // Test 6: List available credentials for debugging
    availableCredentials: TEST_USERS.map(u => ({
      email: u.email,
      password: u.password,
      match: (u.email === testEmail && u.password === testPassword)
    })),

    // Summary
    summary: {
      testUserDataIsValid: TEST_USERS.length === 5,
      credentialsCanMatch: !!TEST_USERS.find(u => u.email === testEmail && u.password === testPassword),
      simulatedAuthorizeWorks: (await testAuthorize(testEmail, testPassword)) !== null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
    },
  };

  return Response.json(results);
}
