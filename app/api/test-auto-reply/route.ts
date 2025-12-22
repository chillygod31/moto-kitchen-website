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
    const eventTypeLabel = "Wedding";
    const customerDateDisplay = "Wednesday, 24 December 2025";
    const guestCount = "25";
    const location = "Zoetermeer";
    const customerBudgetDisplay = "€250-500";

    // Read logo and convert to base64
    const logoPath = path.join(process.cwd(), "public", "logo1.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    const logoDataUri = `data:image/png;base64,${logoBase64}`;

      const autoReplyHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #FAF6EF; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #3A2A24; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .checkmark { color: #4CAF50; font-size: 24px; font-weight: bold; }
            .section { margin: 20px 0; padding: 15px; background: #F1E7DA; border-radius: 4px; }
            .section-title { font-weight: bold; color: #3A2A24; margin-bottom: 10px; }
            .link { color: #C9653B; text-decoration: none; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #F1E7DA; border-top: 1px solid #E6D9C8; }
            .signature { margin-top: 30px; }
            h1 { margin: 0; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 8px 0; }
            .logo-container { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; flex-direction: column; }
            .logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: white; line-height: 1.2; margin: 0; }
            .tagline { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.9; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="${logoDataUri}" alt="Moto Kitchen" style="height: 50px; width: auto; display: block; margin-bottom: 8px;" />
                <span class="logo-text">Moto Kitchen</span>
                <p class="tagline">EAST AFRICAN CATERING SERVICE</p>
              </div>
            </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Thank you for reaching out to Moto Kitchen! We're excited to help make your ${eventTypeLabel.toLowerCase()} unforgettable.</p>
            
            <div class="section">
              <p class="checkmark">✓ YOUR REQUEST HAS BEEN RECEIVED</p>
              <p>We've got all your details and will send you a personalised quote within 24 hours.</p>
            </div>

            <div class="section">
              <p class="section-title">EVENT SUMMARY:</p>
              <ul>
                <li><strong>Date:</strong> ${customerDateDisplay}</li>
                <li><strong>Guests:</strong> ${guestCount} people</li>
                <li><strong>Location:</strong> ${location}</li>
                <li><strong>Budget:</strong> ${customerBudgetDisplay}</li>
              </ul>
            </div>

            <div class="section">
              <p class="section-title">WHAT HAPPENS NEXT:</p>
              <ol>
                <li><strong>Within 24 hours:</strong> You'll receive a custom quote with menu options</li>
                <li><strong>We're here to help!</strong> Questions? Reply to this email</li>
              </ol>
            </div>

            <p>In the meantime, check out:</p>
            <ul>
              <li>→ <a href="https://motokitchen.nl/menu" class="link">Our full menu</a></li>
              <li>→ <a href="https://motokitchen.nl/gallery" class="link">See our recent events</a></li>
              <li>→ Follow us on Instagram: <a href="https://instagram.com/motokitchen.nl" class="link">@motokitchen.nl</a></li>
            </ul>

            <div class="signature">
              <p><strong>Karibu (Welcome)!</strong></p>
              <p>Susan & The Moto Kitchen Team</p>
            </div>
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

Thank you for reaching out to Moto Kitchen! We're excited to help make your ${eventTypeLabel.toLowerCase()} unforgettable.

✓ YOUR REQUEST HAS BEEN RECEIVED

We've got all your details and will send you a personalised quote within 24 hours.

EVENT SUMMARY:
- Date: ${customerDateDisplay}
- Guests: ${guestCount} people
- Location: ${location}
- Budget: ${customerBudgetDisplay}

WHAT HAPPENS NEXT:

1. Within 24 hours: You'll receive a custom quote with menu options
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

