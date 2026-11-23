/**
 * Server-only Resend delivery adapter for WPU passwordless verification.
 * Never import into a Client Component. No public API is exposed by this module.
 */
import "server-only";

const ENDPOINT = "https://api.resend.com/emails";
const SENDER = "WPU <verify@mail.worldpickleball.world>";

export type VerificationDelivery = {
  to: string;
  code: string;
  apiKey: string;
  fetcher?: typeof fetch;
};

export async function sendVerificationCode({ to, code, apiKey, fetcher = fetch }: VerificationDelivery): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || to.length > 254) throw new Error("Invalid recipient");
  if (!/^\d{6}$/.test(code)) throw new Error("Invalid verification code");
  if (!apiKey) throw new Error("Resend API key not configured");

  const response = await fetcher(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER,
      to: [to],
      subject: "Your WPU verification code",
      text: `Your World Pickleball Union verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email. Never share this code.`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0B2A66"><h2>World Pickleball Union</h2><p>Your verification code:</p><p style="font-size:32px;font-weight:700;letter-spacing:5px">${code}</p><p>Expires in 10 minutes. If you did not request this, ignore this message. Never share this code.</p></body></html>`,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    // Never log or return provider response bodies: they may contain sensitive metadata.
    throw new Error(`Verification email delivery failed (HTTP ${response.status})`);
  }
}
