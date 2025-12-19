# Auto-Reply Email Setup

## Overview
The auto-reply email feature sends a confirmation email to customers when they submit a quote request. It's currently **disabled by default** until you're ready to test it.

## How to Enable

1. **Add environment variable to `.env.local` (for local testing):**
   ```
   ENABLE_AUTO_REPLY=true
   ```

2. **Add environment variable to Vercel (for production):**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `ENABLE_AUTO_REPLY` = `true`

## Setting Up Your Resend "From" Email Address

Once you've verified your domain with Resend, update the "from" email address:

1. **Add to `.env.local`:**
   ```
   RESEND_FROM_EMAIL=Moto Kitchen <contact@motokitchen.nl>
   ```

2. **Add to Vercel:**
   - Add: `RESEND_FROM_EMAIL` = `Moto Kitchen <contact@motokitchen.nl>`

**Note:** Until you set `RESEND_FROM_EMAIL`, it will use `onboarding@resend.dev` (Resend's test domain).

## Email Template

The auto-reply email includes:
- ✓ Confirmation that the request was received
- Event summary (date, guests, location, budget)
- What happens next (24-hour quote timeline)
- Links to menu, gallery, and Instagram
- Professional signature from Susan & The Moto Kitchen Team

## Testing

1. Set `ENABLE_AUTO_REPLY=true` in your environment variables
2. Submit a test quote request through the contact form
3. Check the customer's email inbox for the auto-reply
4. Verify all links work correctly
5. Check that the email looks good on mobile devices

## Current Status

- ✅ Email template is implemented and ready
- ⏸️ Auto-reply is **disabled** by default (set `ENABLE_AUTO_REPLY=true` to enable)
- ⏸️ Using test "from" address until `RESEND_FROM_EMAIL` is configured

