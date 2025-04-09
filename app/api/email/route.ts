import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client with IAM role
const sesClient = new SESClient({
  region: 'ap-south-1', // Mumbai region
});

export async function POST(request: Request) {
  try {
    const { toEmail, customerName, state, model, tubSerialNumber } = await request.json();

    // Validate required fields
    if (!toEmail || !customerName || !state || !model || !tubSerialNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const params = {
      Source: 'next.vipul2@gmail.com',
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: 'Thank you for your PDI Form Submission',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body>
                  <h2>Thank you for your submission!</h2>
                  <p>Dear ${customerName},</p>
                  <p>We have received your PDI form submission with the following details:</p>
                  <ul>
                    <li>State: ${state}</li>
                    <li>Model: ${model}</li>
                    <li>Tub Serial Number: ${tubSerialNumber}</li>
                  </ul>
                  <p>We will process your submission and get back to you if we need any additional information.</p>
                  <p>Best regards,<br/>Your Team</p>
                </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
              Thank you for your submission!
              
              Dear ${customerName},
              
              We have received your PDI form submission with the following details:
              
              State: ${state}
              Model: ${model}
              Tub Serial Number: ${tubSerialNumber}
              
              We will process your submission and get back to you if we need any additional information.
              
              Best regards,
              Your Team
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
      return NextResponse.json({ 
        message: 'Email sent successfully', 
        messageId: response.MessageId 
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 