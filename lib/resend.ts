import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_ADDRESS = 'SkaleFlow <noreply@manamarketing.co.za>';

export async function sendBookingEmail({
  to,
  applicantName,
  bookingUrl,
}: {
  to: string;
  applicantName: string;
  bookingUrl: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Book your SkaleFlow onboarding call',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#FAF9F5;">
  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F1F1D;">
    <tr>
      <td align="center" style="padding:24px;">
        <span style="font-family:Georgia,serif;font-weight:bold;font-size:17px;color:#FAF9F5;letter-spacing:1px;">
          MANA<span style="font-family:sans-serif;font-size:11px;font-weight:normal;color:#8A8A7A;margin-left:6px;">MARKETING</span>
        </span>
      </td>
    </tr>
  </table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:40px 24px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(30,107,99,0.08);overflow:hidden;">
          <tr>
            <td style="padding:40px 36px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#2A2A28;margin:0 0 16px 0;">
                Congratulations, ${applicantName}!
              </h1>
              <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 24px 0;">
                Your application has been approved. The next step is to book a short onboarding call with our team so we can learn more about your business and get you set up.
              </p>
              <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 32px 0;">
                Click the button below to choose a time that works for you. The call is 30 minutes on Google Meet.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${bookingUrl}" style="display:inline-block;padding:14px 36px;background-color:#C9A84C;color:#0F1F1D;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">
                      Book Your Call
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.6;color:#8A8A7A;margin:32px 0 0 0;text-align:center;">
                This link expires in 7 days. If you have trouble, reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:0 24px 40px;">
        <p style="font-size:12px;color:#8A8A7A;margin:0;">
          &copy; ${new Date().getFullYear()} Mana Marketing &middot; Sabie, Mpumalanga, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error(`Failed to send booking email: ${error.message}`);
  }

  return data;
}

export async function sendAutomationEmail({
  to,
  subject,
  bodyHtml,
  fromName,
}: {
  to: string;
  subject: string;
  bodyHtml: string;
  fromName?: string;
}) {
  const from = fromName ? `${fromName} <noreply@manamarketing.co.za>` : FROM_ADDRESS;

  const { data, error } = await getResend().emails.send({
    from,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#FAF9F5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:40px 24px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(30,107,99,0.08);overflow:hidden;">
          <tr>
            <td style="padding:40px 36px;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:0 24px 40px;">
        <p style="font-size:12px;color:#8A8A7A;margin:0;">
          &copy; ${new Date().getFullYear()} Mana Marketing &middot; Sabie, Mpumalanga, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('Automation email error:', error);
    throw new Error(`Failed to send automation email: ${error.message}`);
  }

  return data;
}

export async function sendTeamInviteEmail({
  to,
  inviterName,
  organizationName,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `You've been invited to join ${organizationName} on SkaleFlow`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#FAF9F5;">
  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F1F1D;">
    <tr>
      <td align="center" style="padding:24px;">
        <span style="font-family:Georgia,serif;font-weight:bold;font-size:17px;color:#FAF9F5;letter-spacing:1px;">
          MANA<span style="font-family:sans-serif;font-size:11px;font-weight:normal;color:#8A8A7A;margin-left:6px;">MARKETING</span>
        </span>
      </td>
    </tr>
  </table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:40px 24px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(30,107,99,0.08);overflow:hidden;">
          <tr>
            <td style="padding:40px 36px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#2A2A28;margin:0 0 16px 0;">
                You're invited!
              </h1>
              <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 8px 0;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on SkaleFlow.
              </p>
              <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 32px 0;">
                Click the button below to accept your invitation and set up your account. This link expires in 7 days.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display:inline-block;padding:14px 36px;background-color:#C9A84C;color:#0F1F1D;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.6;color:#8A8A7A;margin:32px 0 0 0;text-align:center;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:0 24px 40px;">
        <p style="font-size:12px;color:#8A8A7A;margin:0;">
          &copy; ${new Date().getFullYear()} Mana Marketing &middot; Sabie, Mpumalanga, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('Team invite email error:', error);
    throw new Error(`Failed to send invite email: ${error.message}`);
  }

  return data;
}

export async function sendNotificationEmail({
  to,
  title,
  body,
  link,
}: {
  to: string;
  title: string;
  body: string;
  link?: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: title,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#FAF9F5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0F1F1D;">
    <tr>
      <td align="center" style="padding:24px;">
        <span style="font-family:Georgia,serif;font-weight:bold;font-size:17px;color:#FAF9F5;letter-spacing:1px;">
          MANA<span style="font-family:sans-serif;font-size:11px;font-weight:normal;color:#8A8A7A;margin-left:6px;">MARKETING</span>
        </span>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:40px 24px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(30,107,99,0.08);overflow:hidden;">
          <tr>
            <td style="padding:40px 36px;">
              <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#2A2A28;margin:0 0 16px 0;">
                ${title}
              </h1>
              <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 32px 0;">
                ${body}
              </p>
              ${link ? `
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${link}" style="display:inline-block;padding:14px 36px;background-color:#C9A84C;color:#0F1F1D;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;letter-spacing:0.5px;">
                      View in SkaleFlow
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F5;">
    <tr>
      <td align="center" style="padding:0 24px 40px;">
        <p style="font-size:12px;color:#8A8A7A;margin:0;">
          &copy; ${new Date().getFullYear()} Mana Marketing &middot; Sabie, Mpumalanga, South Africa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) {
    console.error('Notification email error:', error);
    throw new Error(`Failed to send notification email: ${error.message}`);
  }

  return data;
}
