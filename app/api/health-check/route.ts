export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    version: 'recovery-endpoint-ready',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
