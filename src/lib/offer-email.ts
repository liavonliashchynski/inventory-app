import { sendMail } from "@/lib/email";

type Currency = "USD" | "EUR" | "PLN";

type OfferEmailItem = {
  productName: string;
  quantity: number;
  price: string | number;
  currency: Currency;
};

const currencyFormatters: Partial<Record<Currency, Intl.NumberFormat>> = {};

function formatMoney(amount: number, currency: Currency) {
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    });
  }

  return currencyFormatters[currency]!.format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getAppUrl(requestUrl: string) {
  return process.env.APP_URL?.trim() || new URL(requestUrl).origin;
}

export async function sendOfferEmail({
  to,
  requestUrl,
  publicToken,
  companyName,
  companyEmail,
  companyPhone,
  companyWebsite,
  companyAddress,
  clientName,
  offerNumber,
  validUntil,
  notes,
  items,
}: {
  to: string;
  requestUrl: string;
  publicToken: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyWebsite: string | null;
  companyAddress: string | null;
  clientName: string | null;
  offerNumber: string | null;
  validUntil: Date | null;
  notes: string | null;
  items: OfferEmailItem[];
}) {
  const offerUrl = new URL(`/offers/${publicToken}`, getAppUrl(requestUrl));
  const offerLabel = offerNumber || "your offer";
  const recipientName = clientName || "there";
  const rows = items.map((item) => {
    const rowTotal = Number(item.price) * item.quantity;

    return {
      ...item,
      unitPrice: formatMoney(Number(item.price), item.currency),
      rowTotal: formatMoney(rowTotal, item.currency),
    };
  });

  const totalsByCurrency = new Map<Currency, number>();

  for (const item of items) {
    totalsByCurrency.set(
      item.currency,
      (totalsByCurrency.get(item.currency) ?? 0) +
        Number(item.price) * item.quantity,
    );
  }

  const totalLine = [...totalsByCurrency.entries()]
    .map(([currency, total]) => formatMoney(total, currency))
    .join(" / ");

  const subject = `${companyName} sent ${offerLabel}`;
  const companyDetails = [
    companyEmail ? `Email: ${companyEmail}` : null,
    companyPhone ? `Phone: ${companyPhone}` : null,
    companyWebsite ? `Website: ${companyWebsite}` : null,
    companyAddress ? `Address: ${companyAddress}` : null,
  ].filter(Boolean);
  const text = [
    `Hi ${recipientName},`,
    "",
    `${companyName} sent you ${offerLabel}.`,
    "",
    "Offer summary:",
    ...rows.map(
      (item) =>
        `- ${item.productName}: ${item.quantity} x ${item.unitPrice} = ${item.rowTotal}`,
    ),
    "",
    `Total: ${totalLine}`,
    validUntil ? `Valid until: ${formatDate(validUntil)}` : null,
    notes ? `Notes: ${notes}` : null,
    "",
    companyDetails.length ? "Company details:" : null,
    ...companyDetails,
    "",
    `View offer: ${offerUrl.toString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="margin:0 0 16px;">
        ${escapeHtml(companyName)} sent you
        <strong>${escapeHtml(offerLabel)}</strong>.
      </p>
      <p style="margin:0 0 20px;">
        <a
          href="${offerUrl.toString()}"
          style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;"
        >
          View offer
        </a>
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #cbd5e1;">Item</th>
            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #cbd5e1;">Qty</th>
            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #cbd5e1;">Unit price</th>
            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #cbd5e1;">Line total</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (item) => `
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.productName)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.quantity}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.unitPrice}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.rowTotal}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <p style="margin:0 0 8px;"><strong>Total:</strong> ${escapeHtml(totalLine)}</p>
      ${
        validUntil
          ? `<p style="margin:0 0 8px;"><strong>Valid until:</strong> ${escapeHtml(formatDate(validUntil))}</p>`
          : ""
      }
      ${
        notes
          ? `<p style="margin:0 0 16px;"><strong>Notes:</strong> ${escapeHtml(notes)}</p>`
          : ""
      }
      ${
        companyDetails.length
          ? `<div style="margin:0 0 16px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
              <p style="margin:0 0 8px;font-weight:700;">Company details</p>
              ${
                companyEmail
                  ? `<p style="margin:0 0 6px;">Email: ${escapeHtml(companyEmail)}</p>`
                  : ""
              }
              ${
                companyPhone
                  ? `<p style="margin:0 0 6px;">Phone: ${escapeHtml(companyPhone)}</p>`
                  : ""
              }
              ${
                companyWebsite
                  ? `<p style="margin:0 0 6px;">Website: <a href="${escapeHtml(companyWebsite)}" style="color:#0f766e;">${escapeHtml(companyWebsite)}</a></p>`
                  : ""
              }
              ${
                companyAddress
                  ? `<p style="margin:0;white-space:pre-wrap;">Address: ${escapeHtml(companyAddress)}</p>`
                  : ""
              }
            </div>`
          : ""
      }
      <p style="margin:0;color:#475569;">
        If the button does not work, open this link:<br />
        <a href="${offerUrl.toString()}" style="color:#0f766e;word-break:break-all;">${offerUrl.toString()}</a>
      </p>
    </div>
  `;

  await sendMail({
    to,
    subject,
    html,
    text,
  });
}
