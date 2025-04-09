import twilio from 'twilio';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client only if environment variables are available
let twilioClient: any = null;
if (typeof window === 'undefined' && accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send SMS message using Twilio
 * @param phoneNumber Phone number to send the message to
 * @param message Message content
 * @returns Object with success status and message ID or error
 */
export async function sendSMS(phoneNumber: string, message: string) {
  try {
    if (!twilioClient) {
      console.error('Twilio client not initialized. Missing credentials or server-side initialization.');
      return {
        success: false,
        error: 'Twilio client not initialized. Check your environment variables.'
      };
    }

    if (!twilioPhoneNumber) {
      console.error('Twilio phone number not configured.');
      return {
        success: false,
        error: 'Twilio phone number not configured.'
      };
    }

    // Format phone number to E.164 format
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Send SMS using Twilio
    const response = await twilioClient.messages.create({
      body: message,
      to: formattedNumber,
      from: twilioPhoneNumber
    });

    return {
      success: true,
      messageId: response.sid
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates a formatted message for customer notifications
 * @param customerName Customer's name
 * @param state Customer's state
 * @param model Product model/item
 * @returns Formatted message string
 */
export function createNotificationMessage(customerName: string, state: string, model: string): string {
  return `Dear ${customerName} from ${state}, your item ${model} will be packed. Thanks for choosing our services.`;
}

/**
 * Format phone number to E.164 format
 * @param phoneNumber Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
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