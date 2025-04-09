import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client with IAM role and configuration options
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1', // Use environment variable if available
  maxAttempts: 3, // Retry up to 3 times
  logger: console, // Enable logging for debugging
});

export async function POST(request: Request) {
  try {
    console.log('Email API route called');
    const { toEmail, customerName, state, model, tubSerialNumber, images } = await request.json();
    console.log('Email request data:', { 
      toEmail, 
      customerName, 
      state, 
      model, 
      tubSerialNumber,
      hasImages: images ? 'Yes' : 'No',
      imageCount: images ? JSON.parse(images).length : 0
    });

    // Validate required fields
    if (!toEmail || !customerName || !state || !model || !tubSerialNumber) {
      console.error('Missing required fields:', { toEmail, customerName, state, model, tubSerialNumber });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Make sure the destination email is valid
    if (!toEmail.includes('@') || !toEmail.includes('.')) {
      console.error('Invalid email address:', toEmail);
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // For testing in sandbox mode, you can use a verified email
    const sourceEmail = process.env.SES_EMAIL || 'next.vipul2@gmail.com';
    console.log('Using source email:', sourceEmail);

    // Parse image data if available
    let imageData = [];
    try {
      if (images) {
        imageData = JSON.parse(images);
        console.log(`Found ${imageData.length} images to attach`);
      }
    } catch (parseError) {
      console.error('Error parsing image data:', parseError);
    }

    // Create email with attachments
    const params = {
      Source: sourceEmail,
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
                    <li>Number of Images: ${imageData.length || 0}</li>
                  </ul>
                  ${imageData.length > 0 ? '<p>Your images are attached to this email.</p>' : ''}
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
              Number of Images: ${imageData.length || 0}
              
              ${imageData.length > 0 ? 'Your images are attached to this email.' : ''}
              
              We will process your submission and get back to you if we need any additional information.
              
              Best regards,
              Your Team
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // Add attachments if available
    if (imageData.length > 0) {
      const rawEmail = createEmailWithAttachments(
        sourceEmail, 
        [toEmail], 
        'Thank you for your PDI Form Submission', 
        params.Message.Body.Html.Data, 
        params.Message.Body.Text.Data, 
        imageData
      );

      try {
        console.log('Sending email with attachments...');
        // For raw email, we need to use a different command
        const rawCommand = new SendRawEmailCommand({
          RawMessage: { Data: Buffer.from(rawEmail) }
        });
        const response = await sesClient.send(rawCommand);
        console.log('Email with attachments sent successfully:', response);
        return NextResponse.json({ 
          message: 'Email with attachments sent successfully', 
          messageId: response.MessageId 
        });
      } catch (error: any) {
        console.error('Error sending email with attachments:', error);
        console.error('Error details:', JSON.stringify({
          code: error.code,
          name: error.name,
          message: error.message,
          requestId: error.$metadata?.requestId,
          statusCode: error.$metadata?.httpStatusCode,
          cfId: error.$metadata?.cfId,
          extendedRequestId: error.$metadata?.extendedRequestId
        }));
        
        // Fall back to sending email without attachments
        console.log('Falling back to sending email without attachments');
      }
    }

    // Send regular email (either as primary method or fallback)
    try {
      console.log('Sending email with params:', JSON.stringify(params, null, 2));
      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
      console.log('Email sent successfully:', response);
      return NextResponse.json({ 
        message: 'Email sent successfully', 
        messageId: response.MessageId 
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      console.error('Error details:', JSON.stringify({
        code: error.code,
        name: error.name,
        message: error.message,
        requestId: error.$metadata?.requestId,
        statusCode: error.$metadata?.httpStatusCode,
        cfId: error.$metadata?.cfId,
        extendedRequestId: error.$metadata?.extendedRequestId
      }));
      
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: error.message,
          code: error.code,
          name: error.name
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Creates a raw email with attachments using MIME format
 */
function createEmailWithAttachments(from: string, to: string[], subject: string, htmlBody: string, textBody: string, attachments: any[]) {
  // Generate a boundary string for MIME parts
  const boundary = `----=_Part_${Math.random().toString(36).substr(2)}`;
  
  // Create email headers
  const headers = [
    `From: ${from}`,
    `To: ${to.join(', ')}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ].join('\r\n') + '\r\n\r\n';
  
  // Start building the email body
  let body = '';
  
  // Add text part
  body += `--${boundary}\r\n`;
  body += 'Content-Type: text/plain; charset=UTF-8\r\n\r\n';
  body += textBody.trim() + '\r\n\r\n';
  
  // Add HTML part
  body += `--${boundary}\r\n`;
  body += 'Content-Type: text/html; charset=UTF-8\r\n\r\n';
  body += htmlBody.trim() + '\r\n\r\n';
  
  // Add attachments
  attachments.forEach((attachment, index) => {
    if (!attachment || !attachment.data) return;
    
    // Extract the base64 data - remove data:image/jpeg;base64, prefix
    let base64Data = attachment.data;
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    // Get file extension from MIME type or default to jpg
    const mimeType = attachment.type || 'image/jpeg';
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    
    body += `--${boundary}\r\n`;
    body += `Content-Type: ${mimeType}\r\n`;
    body += 'Content-Transfer-Encoding: base64\r\n';
    body += `Content-Disposition: attachment; filename="attachment-${index + 1}.${fileExtension}"\r\n\r\n`;
    
    // Add base64 data in lines of 76 characters
    const dataLines = base64Data.match(/.{1,76}/g) || [];
    body += dataLines.join('\r\n') + '\r\n\r\n';
  });
  
  // Close the MIME boundary
  body += `--${boundary}--\r\n`;
  
  return headers + body;
} 