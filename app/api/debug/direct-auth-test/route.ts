/**
 * Direct authentication test - simulates the authorize() function logic
 */

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const testEmail = searchParams.get('email') || 'teste@teste.com';
  const testPassword = searchParams.get('password') || 'teste123';

  // Exact copy of TEST_USERS from lib/auth.ts
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

  // Simulate the exact authorize() logic
  const testUser = TEST_USERS.find(
    (u) => u.email === testEmail && u.password === testPassword
  );

  if (testUser) {
    return Response.json({
      success: true,
      message: 'Credentials are VALID - User found',
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // No match found
  return Response.json({
    success: false,
    message: 'Credentials are INVALID - User not found',
    testEmail,
    testPassword,
    availableUsers: TEST_USERS.map((u) => ({
      email: u.email,
      password: u.password,
    })),
    timestamp: new Date().toISOString(),
  });
}
