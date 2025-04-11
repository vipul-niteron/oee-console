import { NextResponse } from 'next/server';
import { sendWhatsAppMessageWithImages } from '@/app/utils/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toNumber, customerName, state, model, tubSerialNumber, images } = body;

    // Validate required fields
    if (!toNumber || !customerName || !state || !model || !tubSerialNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format the message
    const message = `
Thank you for choosing Niteron! 🎉

Dear ${customerName},

We have received your PDI submission with the following details:
- State: ${state}
- Model: ${model}
- Tub Serial Number: ${tubSerialNumber}

Our team will review your submission and get back to you shortly. We appreciate your trust in our service! 🙏

Best regards,
Niteron Team
    `.trim();

    // Send WhatsApp message with images
    const result = await sendWhatsAppMessageWithImages(
      toNumber,
      message,
      images || []
    );

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: result.messageId,
      imageMessageIds: result.imageMessageIds,
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send WhatsApp message', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 