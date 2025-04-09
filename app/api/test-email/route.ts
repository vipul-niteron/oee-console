import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';

// Initialize SES client with IAM role and configuration options
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1', // Use environment variable if available
  maxAttempts: 3, // Retry up to 3 times
  logger: console, // Enable logging for debugging
});

export async function GET(request: Request) {
  try {
    console.log('Testing SES configuration...');
    
    // Check SES quota to verify permissions
    try {
      const quotaCommand = new GetSendQuotaCommand({});
      const quotaResponse = await sesClient.send(quotaCommand);
      console.log('SES quota information:', quotaResponse);
      
      return NextResponse.json({
        message: 'SES service is available',
        quota: quotaResponse,
        status: 'Service check passed'
      });
    } catch (quotaError: any) {
      console.error('Error getting SES quota:', quotaError);
      return NextResponse.json({
        error: 'Failed to get SES quota',
        details: quotaError.message,
        code: quotaError.code,
        name: quotaError.name,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error testing SES:', error);
    return NextResponse.json({
      error: 'Error testing SES',
      details: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('Test email API route called');
    
    // Get test email from query parameters or use a default
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || process.env.TEST_EMAIL || 'your-verified-email@example.com';
    
    if (!testEmail.includes('@')) {
      return NextResponse.json({
        error: 'Invalid test email address',
      }, { status: 400 });
    }
    
    // Use a verified sender email
    const sourceEmail = process.env.SES_EMAIL || 'next.vipul2@gmail.com';
    
    console.log(`Sending test email from ${sourceEmail} to ${testEmail}`);
    
    const params = {
      Source: sourceEmail,
      Destination: {
        ToAddresses: [testEmail],
      },
      Message: {
        Subject: {
          Data: 'Test Email from OEE Console',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body>
                  <h2>SES Test Email</h2>
                  <p>This is a test email to verify that AWS SES is working correctly.</p>
                  <p>If you received this email, the service is configured properly.</p>
                  <p>Time sent: ${new Date().toISOString()}</p>
                </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
              SES Test Email
              
              This is a test email to verify that AWS SES is working correctly.
              If you received this email, the service is configured properly.
              
              Time sent: ${new Date().toISOString()}
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };
    
    try {
      console.log('Sending test email with params:', JSON.stringify(params, null, 2));
      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
      console.log('Test email sent successfully:', response);
      
      return NextResponse.json({
        message: 'Test email sent successfully',
        messageId: response.MessageId,
        sentTo: testEmail,
      });
    } catch (emailError: any) {
      console.error('Error sending test email:', emailError);
      console.error('Error details:', JSON.stringify({
        code: emailError.code,
        name: emailError.name,
        message: emailError.message,
        requestId: emailError.$metadata?.requestId,
        statusCode: emailError.$metadata?.httpStatusCode,
      }));
      
      return NextResponse.json({
        error: 'Failed to send test email',
        details: emailError.message,
        code: emailError.code,
        name: emailError.name,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing test email request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
} 