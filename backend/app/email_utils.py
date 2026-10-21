import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from .config import settings

logger = logging.getLogger(__name__)

def send_password_reset_email(to_email: str, recipient_name: str, reset_token: str) -> bool:
    """
    Sends a styled password reset email to the recipient.
    If SMTP credentials are not configured, prints the reset link to the console/logs
    so developers and users can easily reset passwords during local development.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")
    reset_url = f"{frontend_base}/reset-password?token={reset_token}"
    name = recipient_name or "Valued Member"

    # Always log the reset link for local testing and debugging
    logger.info(
        "\n"
        + "=" * 70
        + f"\n[PASSWORD RESET LINK GENERATED]\n"
        f"Recipient: {name} <{to_email}>\n"
        f"Reset URL: {reset_url}\n"
        f"Expires: 30 minutes\n"
        + "=" * 70
    )

    # Check if SMTP is configured
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"[SMTP NOT CONFIGURED] Password reset email was NOT sent over network. "
            f"Use the logged Reset URL above for local testing. "
            f"To enable real emails, configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env."
        )
        return False

    # Build the HTML & Plain text email
    subject = "Reset Your BuyWay Password"
    from_header = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"

    text_content = f"""Hello {name},

We received a request to reset your password for your BuyWay account.

Click the link below to set a new password (valid for 30 minutes):
{reset_url}

If you did not request this, please disregard this email. Your password will remain unchanged.

Best regards,
The BuyWay Team
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #251117;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EFE2DE; overflow: hidden; box-shadow: 0 4px 12px rgba(184,88,110,0.08);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #B8586E 0%, #D48B9D 100%);"></td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="font-size: 22px; font-weight: 700; color: #331B21; margin: 0 0 16px 0; letter-spacing: -0.5px;">
                Reset Your Password
              </h2>
              <p style="font-size: 14px; line-height: 22px; color: #705960; margin: 0 0 20px 0;">
                Hello <strong style="color: #251117;">{name}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 22px; color: #705960; margin: 0 0 28px 0;">
                We received a request to reset the password for your BuyWay account. Click the button below to choose a new password. This link is valid for <strong>30 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background-color: #B8586E;">
                    <a href="{reset_url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 9999px; letter-spacing: 0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 18px; color: #8C7077; margin: 0 0 12px 0;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 11px; line-height: 16px; color: #B8586E; word-break: break-all; margin: 0 0 28px 0;">
                <a href="{reset_url}" style="color: #B8586E; text-decoration: underline;">{reset_url}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #F2E8E5; margin: 24px 0;" />

              <p style="font-size: 12px; line-height: 18px; color: #8C7077; margin: 0;">
                If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #FAF7F2; border-top: 1px solid #EFE2DE; text-align: center; font-size: 11px; color: #8C7077;">
              &copy; BuyWay E-Commerce Store &bull; Secure Authentication System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    # Assemble MIME Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to_email

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        if settings.SMTP_PORT == 465:
            # SSL
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=15) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        else:
            # STARTTLS (port 587 or default)
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.ehlo()
                context = ssl.create_default_context()
                server.starttls(context=context)
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)

        logger.info(f"Successfully sent password reset email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
        return False
