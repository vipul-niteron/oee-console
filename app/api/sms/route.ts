import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client
let twilioClient: any = null;
if (accountSid && authToken) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number starts with 0, remove it
  const withoutZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  
  // If the number is 10 digits, add +91
  if (withoutZero.length === 10) {
    return `+91${withoutZero}`;
  }
  
  // If the number already has country code, return as is
  if (withoutZero.startsWith('91') && withoutZero.length === 12) {
    return `+${withoutZero}`;
  }
  
  // Return the original number if it doesn't match any format
  return phoneNumber;
}

export async function POST(request: NextRequest) {
  try {
    console.log('SMS API route called');
    const body = await request.json();
    const { phoneNumber, message } = body;
    console.log('SMS request data:', { phoneNumber, message });

    // Validate required fields
    if (!phoneNumber || !message) {
      console.error('Missing required fields for SMS:', { phoneNumber, message });
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Check if Twilio client is initialized
    if (!twilioClient) {
      console.error('Twilio client not initialized');
      return NextResponse.json(
        { error: 'SMS service not available' },
        { status: 500 }
      );
    }

    // Check if phone number is configured
    if (!twilioPhoneNumber) {
      console.error('Twilio phone number not configured');
      return NextResponse.json(
        { error: 'SMS service not fully configured' },
        { status: 500 }
      );
    }

    // Format phone number to E.164 format
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Formatted phone number:', formattedNumber);
    
    try {
      // Send SMS using Twilio
      const response = await twilioClient.messages.create({
        body: message,
        to: formattedNumber,
        from: twilioPhoneNumber
      });

      console.log('SMS sent successfully:', response.sid);
      return NextResponse.json({
        success: true,
        messageId: response.sid
      });
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        status: error.status,
        moreInfo: error.moreInfo
      });
      
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing SMS request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 