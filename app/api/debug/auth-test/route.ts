import { authOptions } from '@lib/auth';

export async function GET() {
  try {
    // Get the credentials provider
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === 'credentials'
    );

    if (!credentialsProvider) {
      return Response.json({ error: 'Credentials provider not found' });
    }

    // Test with admin user
    const result = await (credentialsProvider as any).authorize?.(
      {
        email: 'admin@empresa.com',
        password: 'admin123',
      },
      {} as any
    );

    return Response.json({
      status: 'Test executed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json({
      error: error.message,
      stack: error.stack,
    });
  }
}
