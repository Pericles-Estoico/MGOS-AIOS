/**
 * Email Enqueue API
 * Story 3.1: Email Notification System Phase 1
 *
 * POST /api/notifications/enqueue - Queue emails for sending
 */

import { queueEmail } from '@/lib/email-service';
import { NextRequest, NextResponse } from 'next/server';

interface EnqueueRequest {
  userId: string;
  recipientEmail: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, string | number | boolean | null>;
}

interface EnqueueBatchRequest {
  emails: EnqueueRequest[];
}

/**
 * POST /api/notifications/enqueue
 * Queue a single email
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnqueueRequest | EnqueueBatchRequest = await request.json();

    // Check if batch or single
    const isBatch = 'emails' in body;
    const emailsToQueue: EnqueueRequest[] = isBatch ? body.emails : [body as EnqueueRequest];

    // Validate emails
    const errors: string[] = [];
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const email of emailsToQueue) {
      // Validate required fields
      if (!email.userId || !email.recipientEmail || !email.templateName) {
        results.push({
          email: email.recipientEmail || 'unknown',
          success: false,
          error: 'Missing required fields: userId, recipientEmail, templateName',
        });
        continue;
      }

      // Validate email format
      if (!isValidEmail(email.recipientEmail)) {
        results.push({
          email: email.recipientEmail,
          success: false,
          error: 'Invalid email format',
        });
        continue;
      }

      try {
        // Queue the email
        const success = await queueEmail({
          userId: email.userId,
          recipientEmail: email.recipientEmail,
          subject: email.subject,
          templateName: email.templateName,
          templateData: email.templateData,
        });

        results.push({
          email: email.recipientEmail,
          success,
          error: success ? undefined : 'Failed to queue email',
        });

        if (!success) {
          errors.push(`Failed to queue email for ${email.recipientEmail}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({
          email: email.recipientEmail,
          success: false,
          error: errorMsg,
        });
        errors.push(errorMsg);
      }
    }

    // Calculate stats
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // Return response
    if (failureCount === 0) {
      return NextResponse.json(
        {
          status: 'success',
          message: `Successfully queued ${successCount} email(s)`,
          total: emailsToQueue.length,
          succeeded: successCount,
          failed: failureCount,
          results,
        },
        { status: 200 }
      );
    } else if (successCount === 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Failed to queue any emails`,
          total: emailsToQueue.length,
          succeeded: successCount,
          failed: failureCount,
          errors,
          results,
        },
        { status: 400 }
      );
    } else {
      // Partial success
      return NextResponse.json(
        {
          status: 'partial',
          message: `Queued ${successCount} out of ${emailsToQueue.length} email(s)`,
          total: emailsToQueue.length,
          succeeded: successCount,
          failed: failureCount,
          errors: errors.length > 0 ? errors : undefined,
          results,
        },
        { status: 207 } // Multi-Status
      );
    }
  } catch (error) {
    console.error('Error in enqueue POST:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/notifications/enqueue
 * CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
