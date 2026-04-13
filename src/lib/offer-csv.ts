import { z } from "zod";

export const offerCsvHeaders = [
  "offerKey",
  "clientName",
  "clientEmail",
  "clientPhone",
  "validUntil",
  "notes",
  "productName",
  "quantity",
] as const;

const offerCsvRowSchema = z.object({
  offerKey: z.string().trim().min(1).max(120),
  clientName: z.string().trim().min(2).max(160),
  clientEmail: z.union([z.literal(""), z.string().trim().email().max(255)]).default(""),
  clientPhone: z.union([z.literal(""), z.string().trim().max(40)]).default(""),
  validUntil: z.union([z.literal(""), z.string().trim()]).default(""),
  notes: z.union([z.literal(""), z.string().trim().max(2000)]).default(""),
  productName: z.string().trim().min(2).max(120),
  quantity: z.coerce.number().int().min(1).max(10_000),
});

export type OfferCsvDraft = {
  offerKey: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  validUntil: string | null;
  notes: string | null;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
};

const escapeCsvValue = (value: string) => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
};

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new Error("CSV contains an unclosed quoted value.");
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const normalizeOptionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeOfferKey = (value: string) => value.trim().toLocaleLowerCase();

const normalizeProductKey = (value: string) => value.trim().toLocaleLowerCase();

const parseValidUntil = (value: string) => {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? "invalid" : normalized;
};

export function buildOffersCsv(
  offers: Array<{
    id: string;
    offerNumber: string | null;
    clientName: string | null;
    clientEmail: string | null;
    client?: {
      phone: string | null;
    } | null;
    validUntil: Date | null;
    notes: string | null;
    items: Array<{
      productName: string;
      quantity: number;
    }>;
  }>,
) {
  const rows = [
    offerCsvHeaders.join(","),
    ...offers.flatMap((offer) => {
      const baseValues = [
        escapeCsvValue(offer.offerNumber || offer.id),
        escapeCsvValue(offer.clientName || ""),
        escapeCsvValue(offer.clientEmail || ""),
        escapeCsvValue(offer.client?.phone || ""),
        escapeCsvValue(
          offer.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 10) : "",
        ),
        escapeCsvValue(offer.notes || ""),
      ];

      if (!offer.items.length) {
        return [baseValues.concat(["", ""]).join(",")];
      }

      return offer.items.map((item) =>
        baseValues
          .concat([
            escapeCsvValue(item.productName),
            escapeCsvValue(String(item.quantity)),
          ])
          .join(","),
      );
    }),
  ];

  return rows.join("\r\n");
}

export function parseOffersCsv(csvText: string): OfferCsvDraft[] {
  const normalizedText = csvText.replace(/^\uFEFF/, "").trim();

  if (!normalizedText) {
    throw new Error("The CSV file is empty.");
  }

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("The CSV file is empty.");
  }

  const headers = splitCsvLine(lines[0]);

  if (
    headers.length !== offerCsvHeaders.length ||
    headers.some((header, index) => header !== offerCsvHeaders[index])
  ) {
    throw new Error(
      `Invalid CSV header. Expected: ${offerCsvHeaders.join(",")}.`,
    );
  }

  const rows = lines.slice(1);

  if (!rows.length) {
    throw new Error("Add at least one offer row below the header.");
  }

  const draftMap = new Map<string, OfferCsvDraft>();

  rows.forEach((line, rowIndex) => {
    const values = splitCsvLine(line);

    if (values.length !== offerCsvHeaders.length) {
      throw new Error(`Row ${rowIndex + 2} has an invalid number of columns.`);
    }

    const row = Object.fromEntries(
      offerCsvHeaders.map((header, index) => [header, values[index]]),
    );

    const parsed = offerCsvRowSchema.safeParse(row);

    if (!parsed.success) {
      throw new Error(
        `Row ${rowIndex + 2}: ${parsed.error.issues[0]?.message || "Invalid offer data."}`,
      );
    }

    const validUntil = parseValidUntil(parsed.data.validUntil);

    if (validUntil === "invalid") {
      throw new Error(`Row ${rowIndex + 2}: Please provide a valid offer expiration date.`);
    }

    const draftKey = normalizeOfferKey(parsed.data.offerKey);
    const existingDraft = draftMap.get(draftKey);
    const nextItem = {
      productName: parsed.data.productName.trim(),
      quantity: parsed.data.quantity,
    };

    if (!existingDraft) {
      draftMap.set(draftKey, {
        offerKey: parsed.data.offerKey.trim(),
        clientName: parsed.data.clientName.trim(),
        clientEmail: normalizeOptionalText(parsed.data.clientEmail),
        clientPhone: normalizeOptionalText(parsed.data.clientPhone),
        validUntil,
        notes: normalizeOptionalText(parsed.data.notes),
        items: [nextItem],
      });
      return;
    }

    if (
      existingDraft.clientName !== parsed.data.clientName.trim() ||
      existingDraft.clientEmail !== normalizeOptionalText(parsed.data.clientEmail) ||
      existingDraft.clientPhone !== normalizeOptionalText(parsed.data.clientPhone) ||
      existingDraft.validUntil !== validUntil ||
      existingDraft.notes !== normalizeOptionalText(parsed.data.notes)
    ) {
      throw new Error(
        `Row ${rowIndex + 2}: Offer rows with the same offerKey must share the same client and offer details.`,
      );
    }

    if (
      existingDraft.items.some(
        (item) =>
          normalizeProductKey(item.productName) ===
          normalizeProductKey(parsed.data.productName),
      )
    ) {
      throw new Error(
        `Row ${rowIndex + 2}: Product "${parsed.data.productName}" is duplicated within offer "${parsed.data.offerKey}".`,
      );
    }

    existingDraft.items.push(nextItem);
  });

  return [...draftMap.values()];
}
