import { processEmailQueue } from '@/lib/email-service';

export const maxDuration = 300; // 5 minutes max for processing

export async function GET(request: Request) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process email queue
    const result = await processEmailQueue();

    return Response.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
