import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not set" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // Sample data for testing
    const name = "Test User";
    const eventType = "wedding"; // Change this to test: "wedding", "private", "corporate", "pickup-only", "other"
    const eventTypeLabel = "Wedding";
    const customerDateDisplay = "Wednesday, 24 December 2025";
    const guestCount = "25";
    const location = "Zoetermeer";
    const customerBudgetDisplay = "€250-500";
    
    // Calculate days until event for testing (using sample date)
    const testEventDate = new Date("2025-12-24");
    const today = new Date();
    const daysUntilEvent = Math.ceil((testEventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine event type wording for greeting
    const isPickupOnly = eventType === "pickup-only" || eventType === "pickup-delivery";
    const eventTypeWording = eventType === "wedding" 
      ? "wedding" 
      : eventType === "private" || eventType === "corporate" || eventType === "other"
      ? "event"
      : null; // null for pickup-only
    
    // Determine quote response time based on days until event
    const quoteResponseTime = daysUntilEvent !== null && daysUntilEvent <= 14 ? "24 hours" : "24 to 48 hours";

    // Read logo and convert to base64
    const logoPath = path.join(process.cwd(), "public", "motoemaillogo.jpg");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    const logoDataUri = `data:image/jpeg;base64,${logoBase64}`;

const autoReplyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              line-height: 1.6; 
              color: #1F1F1F; 
              margin: 0; 
              padding: 0; 
              background: #FAF6EF;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 0;
            }
            .header { 
              background: #2B1E1A; 
              color: white; 
              padding: 32px; 
              text-align: center; 
            }
            .header img {
              max-width: 200px;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            .content { 
              padding: 32px; 
              background: white; 
            }
            .section { 
              margin: 0 0 28px 0;
              padding: 0 0 24px 0;
              border-bottom: 1px solid #E6D9C8;
            }
            .section:last-of-type {
              border-bottom: none;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #3A2A24;
              margin: 0 0 12px 0;
            }
            .confirmation-box {
              background: #F1E7DA;
              padding: 20px;
              border-radius: 4px;
              text-align: center;
              margin: 0 0 28px 0;
            }
            .confirmation-box h2 {
              color: #2E7D32;
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 8px 0;
            }
            .confirmation-box p {
              color: #3A2A24;
              margin: 0;
              font-size: 14px;
            }
            .field {
              margin: 0 0 10px 0;
              font-size: 14px;
            }
            .field:last-child {
              margin-bottom: 0;
            }
            .field-label {
              color: #666;
              font-weight: 400;
              display: inline-block;
              min-width: 80px;
            }
            .field-value {
              color: #1F1F1F;
              font-weight: 500;
            }
            .link { 
              color: #C9653B; 
              text-decoration: none;
            }
            .link:hover {
              text-decoration: underline;
            }
            .footer { 
              padding: 24px 32px; 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              background: #FAF6EF;
              border-top: 1px solid #E6D9C8;
            }
            ol, ul {
              margin: 12px 0;
              padding-left: 20px;
            }
            li {
              margin: 8px 0;
              font-size: 14px;
            }
            p {
              margin: 0 0 16px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoDataUri}" alt="Moto Kitchen" />
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Thank you for reaching out to Moto Kitchen!${eventTypeWording ? ` We're excited to help make your ${eventTypeWording} unforgettable.` : ''}</p>
              
              <div class="confirmation-box">
                <h2>✓ YOUR REQUEST HAS BEEN RECEIVED</h2>
                <p>We've got all your details and will send you a personalised quote within ${quoteResponseTime}.</p>
              </div>

            <div class="section">
              <p class="section-title">EVENT SUMMARY:</p>
              <div class="field">
                <span class="field-label">Date:</span>
                <span class="field-value">${customerDateDisplay}</span>
              </div>
              <div class="field">
                <span class="field-label">Guests:</span>
                <span class="field-value">${guestCount} people</span>
              </div>
              <div class="field">
                <span class="field-label">Location:</span>
                <span class="field-value">${location}</span>
              </div>
              <div class="field">
                <span class="field-label">Budget:</span>
                <span class="field-value">${customerBudgetDisplay}</span>
              </div>
            </div>

            <div class="section">
              <p class="section-title">WHAT HAPPENS NEXT:</p>
              <ol>
                <li><strong>Within ${quoteResponseTime}:</strong> You'll receive a custom quote with menu options</li>
                <li><strong>We're here to help!</strong> Questions? Reply to this email</li>
              </ol>
            </div>

            <div class="section">
              <p>In the meantime, check out:</p>
              <ul>
                <li><a href="https://motokitchen.nl/menu" class="link">Our full menu</a></li>
                <li><a href="https://motokitchen.nl/gallery" class="link">See our recent events</a></li>
                <li>Follow us on Instagram: <a href="https://instagram.com/motokitchen.nl" class="link">@motokitchen.nl</a></li>
              </ul>
            </div>

            <p><strong>Karibu (Welcome)!</strong><br>Susan & The Moto Kitchen Team</p>
          </div>
          
          <div class="footer">
            <p><strong>Moto Kitchen</strong> | East African Catering</p>
            <p><a href="mailto:contact@motokitchen.nl" style="color: #C9653B; text-decoration: none;">contact@motokitchen.nl</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const autoReplyText = `
✓ We received your quote request - Moto Kitchen

Hi ${name},

Thank you for reaching out to Moto Kitchen!${eventTypeWording ? ` We're excited to help make your ${eventTypeWording} unforgettable.` : ''}

✓ YOUR REQUEST HAS BEEN RECEIVED

We've got all your details and will send you a personalised quote within ${quoteResponseTime}.

EVENT SUMMARY:
- Date: ${customerDateDisplay}
- Guests: ${guestCount} people
- Location: ${location}
- Budget: ${customerBudgetDisplay}

WHAT HAPPENS NEXT:

1. Within ${quoteResponseTime}: You'll receive a custom quote with menu options
2. We're here to help! Questions? Reply to this email

In the meantime, check out:
→ Our full menu: https://motokitchen.nl/menu
→ See our recent events: https://motokitchen.nl/gallery
→ Follow us on Instagram: @motokitchen.nl

Karibu (Welcome)!

Susan & The Moto Kitchen Team

---
Moto Kitchen | East African Catering
contact@motokitchen.nl
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "Moto Kitchen <onboarding@resend.dev>";

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: ["chilechhaa@gmail.com"],
      replyTo: "contact@motokitchen.nl",
      subject: "✓ We received your quote request - Moto Kitchen",
      html: autoReplyHtml,
      text: autoReplyText,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Test auto-reply email sent to chilechhaa@gmail.com"
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

