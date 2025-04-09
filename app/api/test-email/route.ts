import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client with IAM role
const sesClient = new SESClient({
  region: 'ap-south-1', // Mumbai region
});

export async function GET(request: Request) {
  try {
    const params = {
      Source: 'next.vipul2@gmail.com',
      Destination: {
        ToAddresses: ['next.vipul2@gmail.com'], // Sending to the same verified email
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
                  <h2>Test Email</h2>
                  <p>This is a test email from your OEE Console application.</p>
                  <p>If you receive this email, it means your email configuration is working correctly!</p>
                  <p>Best regards,<br/>Your Team</p>
                </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
              Test Email
              
              This is a test email from your OEE Console application.
              If you receive this email, it means your email configuration is working correctly!
              
              Best regards,
              Your Team
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    
    return NextResponse.json({ 
      message: 'Test email sent successfully', 
      messageId: response.MessageId 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 