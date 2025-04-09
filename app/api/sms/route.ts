import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, formatPhoneNumber } from '@/app/utils/twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate required fields
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    console.log('Original phone number received:', phoneNumber);
    
    // Format the phone number for Twilio with +91 country code
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    console.log('Formatted phone number for Twilio (with +91):', formattedPhoneNumber);

    // Send the SMS using Twilio
    try {
      const messageSid = await sendSMS(formattedPhoneNumber, message);
      
      console.log('Twilio SMS sent successfully with SID:', messageSid);
      
      return NextResponse.json({ 
        success: true, 
        messageSid,
        to: formattedPhoneNumber,
        message: 'SMS sent successfully via Twilio'
      });
    } catch (twilioError: any) {
      // Handle specific Twilio errors
      console.error('Twilio specific error:', twilioError);
      
      // Handle specific error codes
      if (twilioError.code === 21211) {
        return NextResponse.json(
          { 
            error: 'Invalid phone number format. Please check the phone number.',
            details: 'Make sure the number is a valid Indian mobile number.',
            code: twilioError.code
          },
          { status: 400 }
        );
      }
      
      if (twilioError.code === 21608) {
        return NextResponse.json(
          { error: 'Twilio account not verified for this phone number' },
          { status: 403 }
        );
      }
      
      // For other Twilio errors
      return NextResponse.json(
        { 
          error: 'Twilio error: ' + (twilioError.message || 'Unknown Twilio error'),
          code: twilioError.code || 'unknown',
          status: twilioError.status || 500
        },
        { status: twilioError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('General error in SMS API route:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    
    if (error.code === 21608) {
      return NextResponse.json(
        { error: 'Twilio account not verified for this phone number' },
        { status: 403 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Failed to send SMS',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 