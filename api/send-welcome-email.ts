import type { VercelRequest, VercelResponse } from '@vercel/node';

type UserData = {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  country: string;
  selectedGroup: 'A' | 'B' | 'C' | 'D';
  profilePicture?: string;
};

type EmailResponse = {
  success: boolean;
  message: string;
  emailId?: string;
  error?: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Only POST requests allowed'
    } as EmailResponse);
    return;
  }

  try {
    const userData: UserData = req.body;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'selectedGroup'];
    const missingFields = requiredFields.filter(field => !userData[field as keyof UserData]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: `Missing: ${missingFields.join(', ')}`
      } as EmailResponse);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Please provide a valid email'
      } as EmailResponse);
      return;
    }

    // Simulate email sending delay (0.5-2 seconds)
    const delay = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      res.status(503).json({
        success: false,
        message: 'Email service temporarily unavailable',
        error: 'Please try again in a moment'
      } as EmailResponse);
      return;
    }

    // Generate mock email ID
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get group color for email styling
    const getGroupColor = (group: string) => {
      switch (group) {
        case 'A': return '#ef4444'; // red
        case 'B': return '#3b82f6'; // blue
        case 'C': return '#10b981'; // green
        case 'D': return '#f59e0b'; // amber
        default: return '#6b7280'; // gray
      }
    };

    // Mock email content (in production, this would be sent via email service)
    const emailContent = {
      to: userData.email,
      subject: `🎉 Welcome to Group ${userData.selectedGroup}, ${userData.firstName}!`,
      template: 'welcome',
      data: {
        name: `${userData.firstName} ${userData.lastName}`,
        group: userData.selectedGroup,
        groupColor: getGroupColor(userData.selectedGroup),
        country: userData.country,
        hasProfilePicture: !!userData.profilePicture,
        registrationDate: new Date().toLocaleDateString(),
        downloadLinks: [
          `https://example.com/download/group-${userData.selectedGroup}-image-1.jpg`,
          `https://example.com/download/group-${userData.selectedGroup}-image-2.jpg`,
          `https://example.com/download/group-${userData.selectedGroup}-image-3.jpg`
        ],
        dashboardUrl: `https://dashboard.example.com/group/${userData.selectedGroup.toLowerCase()}`,
        supportEmail: 'support@program.com'
      }
    };

    // Log email simulation (in production, this would be actual email sending)
    console.log('📧 MOCK EMAIL SENT:', {
      emailId,
      timestamp: new Date().toISOString(),
      ...emailContent
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: `Welcome email sent successfully to ${userData.email}`,
      emailId
    } as EmailResponse);

  } catch (error) {
    console.error('Email sending error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to process email request'
    } as EmailResponse);
  }
}