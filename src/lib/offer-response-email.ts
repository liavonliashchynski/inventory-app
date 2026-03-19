import { sendMail } from "@/lib/email";

function getRecipientEmails() {
  return (process.env.OFFERS_NOTIFY_EMAIL || process.env.MAIL_FROM || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getAppUrl(requestUrl: string) {
  return process.env.APP_URL?.trim() || new URL(requestUrl).origin;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendOfferResponseEmail({
  requestUrl,
  companyName,
  offerNumber,
  clientName,
  clientEmail,
  response,
  responseNote,
  publicToken,
}: {
  requestUrl: string;
  companyName: string;
  offerNumber: string | null;
  clientName: string | null;
  clientEmail: string | null;
  response: "ACCEPTED" | "REJECTED";
  responseNote: string | null;
  publicToken: string;
}) {
  const recipients = getRecipientEmails();

  if (!recipients.length) {
    return;
  }

  const offerLabel = offerNumber || "Offer";
  const responseLabel = response === "ACCEPTED" ? "accepted" : "rejected";
  const viewUrl = new URL(`/offers/${publicToken}`, getAppUrl(requestUrl));
  const clientLabel = clientName || clientEmail || "Client";
  const subject = `${offerLabel} was ${responseLabel}`;
  const text = [
    `${clientLabel} ${responseLabel} ${offerLabel}.`,
    clientEmail ? `Client email: ${clientEmail}` : null,
    responseNote ? `Response note: ${responseNote}` : null,
    `Open offer: ${viewUrl.toString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
      <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(offerLabel)} was ${escapeHtml(responseLabel)}</h1>
      <p style="margin:0 0 10px;">
        <strong>${escapeHtml(clientLabel)}</strong> responded to an offer from ${escapeHtml(companyName)}.
      </p>
      ${
        clientEmail
          ? `<p style="margin:0 0 10px;">Client email: ${escapeHtml(clientEmail)}</p>`
          : ""
      }
      ${
        responseNote
          ? `<p style="margin:0 0 16px;">Response note: ${escapeHtml(responseNote)}</p>`
          : ""
      }
      <p style="margin:0;">
        <a href="${viewUrl.toString()}" style="color:#0f766e;">Open offer</a>
      </p>
    </div>
  `;

  await sendMail({
    to: recipients.join(", "),
    subject,
    html,
    text,
  });
}
