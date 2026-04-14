import nodemailer from "nodemailer";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  scheduledAt: Date;
  prescriptionDrug?: string | null;
  prescriptionReason?: string | null;
}

/**
 * Sends a confirmation email when an appointment is confirmed.
 */
export async function sendAppointmentConfirmationEmail(data: AppointmentEmailData): Promise<void> {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(data.scheduledAt);

  const prescriptionSection = data.prescriptionDrug
    ? `
    <tr>
      <td style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Prescription</p>
        <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600;">${data.prescriptionDrug}</p>
        ${data.prescriptionReason ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">${data.prescriptionReason}</p>` : ""}
      </td>
    </tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); border-radius: 12px 12px 0 0; padding: 32px 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Clinicians Unchained</p>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">Appointment Confirmed</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">Your appointment has been officially confirmed.</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background: #ffffff; border-radius: 0 0 12px 12px; padding: 0; border: 1px solid #e2e8f0; border-top: none;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 24px 24px 16px 24px;">
                    <p style="margin: 0; font-size: 15px; color: #475569;">Hi <strong>${data.patientName}</strong>,</p>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #475569;">Your appointment has been confirmed. Here are the details:</p>
                  </td>
                </tr>
                <!-- Details -->
                <tr>
                  <td style="padding: 0 24px 24px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                      <tr>
                        <td style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Patient</p>
                          <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600;">${data.patientName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Doctor</p>
                          <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600;">${data.doctorName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Date &amp; Time</p>
                          <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 600;">${formattedDate}</p>
                        </td>
                      </tr>
                      ${prescriptionSection}
                    </table>
                  </td>
                </tr>
                <!-- Footer note -->
                <tr>
                  <td style="padding: 0 24px 24px 24px;">
                    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px 16px; border-radius: 0 6px 6px 0;">
                      <p style="margin: 0; font-size: 13px; color: #0369a1;">If you need to reschedule or have any questions, please contact your clinic directly.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">Clinicians Unchained &bull; AI Workflow Engine &bull; Automated Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Clinicians Unchained" <${process.env.GMAIL_USER}>`,
      to: data.patientEmail,
      subject: `Appointment Confirmed – ${data.doctorName} on ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(data.scheduledAt)}`,
      html,
    });
    logger.info({ patientEmail: data.patientEmail }, "Appointment confirmation email sent");
  } catch (err) {
    logger.error({ err, patientEmail: data.patientEmail }, "Failed to send confirmation email");
    throw err;
  }
}
