# Email Setup Documentation

## Overview
The app includes a Vercel serverless function that simulates sending welcome emails to users after they complete their registration. **Email functionality is currently active in SuccessStep (Step 4)** and commented out in GeneratedImagesStep.

## Files Created/Modified

### API Function
- **`api/send-welcome-email.ts`** - Vercel serverless function that handles email sending
  - Validates user data
  - Simulates email sending with realistic delays
  - Returns proper success/error responses
  - Includes 5% random failure rate for testing error handling

### Frontend Integration
- **`src/components/registration/SuccessStep.tsx`** - Contains active email functionality
  - Added email sending state management
  - Integrated email API call when component mounts
  - Added loading states and error handling
  - Shows real-time email status (sending/sent/failed)
- **`src/components/registration/GeneratedImagesStep.tsx`** - Email code commented out
  - Email functionality moved to SuccessStep for better UX
  - Simple "Complete Registration" button that proceeds to next step

## How It Works

1. **User completes registration** by clicking "Complete Registration" in GeneratedImagesStep
2. **User reaches SuccessStep** (Step 4) where email sending begins automatically
3. **Email API is called** with user data (name, email, group, etc.)
4. **API validates data** and simulates email sending
5. **Real-time status updates** show sending/sent/failed states
6. **Success feedback** is displayed when email is sent
7. **Error handling** shows failure message but registration remains complete

## Email Content (Simulated)
- **Subject**: "🎉 Welcome to Group {X}, {FirstName}!"
- **Includes**: User name, group assignment, download links, dashboard URL
- **Styling**: Group-specific colors and branding

## Testing

### Success Flow
1. Fill out all registration steps
2. Complete image generation
3. Click "Complete Registration"
4. See loading spinner with "Sending Email..."
5. See success message and email confirmation

### Error Handling
- 5% chance of simulated failure
- Shows error toast with "Continue anyway" option
- User can proceed to success page even if email fails

## Production Setup

To replace with real email service:

1. **Install email service** (Resend, SendGrid, etc.)
2. **Add environment variables** for API keys
3. **Replace simulation code** with actual email sending
4. **Update email templates** with real content
5. **Add proper error logging**

## Environment Variables (for production)
```env
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@yourdomain.com
```

## Deployment
- Works automatically with Vercel deployment
- API function deploys to `/api/send-welcome-email`
- No additional configuration needed for simulation mode