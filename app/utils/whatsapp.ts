import axios from 'axios';

// Initialize WATI API client
const watiClient = axios.create({
  baseURL: process.env.WATI_API_ENDPOINT,
  headers: {
    'Authorization': `Bearer ${process.env.WATI_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export async function sendWhatsAppMessage(toNumber: string, message: string) {
  try {
    const response = await watiClient.post('/api/v1/sendSessionMessage', {
      whatsappNumber: toNumber,
      message: message,
    });

    if (!response.data || !response.data.messageId) {
      throw new Error('Invalid response from WATI API');
    }

    return {
      success: true,
      messageId: response.data.messageId,
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.message || error.message}`);
    }
    throw new Error('Failed to send WhatsApp message');
  }
}

export async function sendWhatsAppImage(toNumber: string, imageUrl: string, caption?: string) {
  try {
    const response = await watiClient.post('/api/v1/sendSessionFile', {
      whatsappNumber: toNumber,
      fileUrl: imageUrl,
      caption: caption || '',
    });

    if (!response.data || !response.data.messageId) {
      throw new Error('Invalid response from WATI API');
    }

    return {
      success: true,
      messageId: response.data.messageId,
    };
  } catch (error) {
    console.error('Error sending WhatsApp image:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to send WhatsApp image: ${error.response?.data?.message || error.message}`);
    }
    throw new Error('Failed to send WhatsApp image');
  }
}

export async function sendWhatsAppMessageWithImages(toNumber: string, message: string, images: string[]) {
  try {
    // Send the text message first
    const messageResult = await sendWhatsAppMessage(toNumber, message);

    // Send each image
    const imageResults = [];
    for (const image of images) {
      const result = await sendWhatsAppImage(toNumber, image);
      imageResults.push(result);
    }

    return {
      success: true,
      message: 'Message and images sent successfully',
      messageId: messageResult.messageId,
      imageMessageIds: imageResults.map(r => r.messageId),
    };
  } catch (error) {
    console.error('Error sending WhatsApp message with images:', error);
    throw error;
  }
} 