import { z } from "zod";

export const clientCsvHeaders = ["name", "email", "phone"] as const;

const clientCsvRowSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.union([z.literal(""), z.string().trim().email().max(255)]).default(""),
  phone: z.union([z.literal(""), z.string().trim().max(40)]).default(""),
});

export type ClientCsvInput = {
  name: string;
  email: string | null;
  phone: string | null;
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

const getClientKey = (row: { name: string; email: string | null }) =>
  `${row.name.trim().toLocaleLowerCase()}::${(row.email || "").trim().toLocaleLowerCase()}`;

export function buildClientsCsv(
  clients: Array<{
    name: string;
    email: string | null;
    phone: string | null;
  }>,
) {
  const rows = [
    clientCsvHeaders.join(","),
    ...clients.map((client) =>
      [
        escapeCsvValue(client.name),
        escapeCsvValue(client.email || ""),
        escapeCsvValue(client.phone || ""),
      ].join(","),
    ),
  ];

  return rows.join("\r\n");
}

export function parseClientsCsv(csvText: string): ClientCsvInput[] {
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
    headers.length !== clientCsvHeaders.length ||
    headers.some((header, index) => header !== clientCsvHeaders[index])
  ) {
    throw new Error(
      `Invalid CSV header. Expected: ${clientCsvHeaders.join(",")}.`,
    );
  }

  const rows = lines.slice(1);

  if (!rows.length) {
    throw new Error("Add at least one client row below the header.");
  }

  const parsedRows = rows.map((line, rowIndex) => {
    const values = splitCsvLine(line);

    if (values.length !== clientCsvHeaders.length) {
      throw new Error(`Row ${rowIndex + 2} has an invalid number of columns.`);
    }

    const row = Object.fromEntries(
      clientCsvHeaders.map((header, index) => [header, values[index]]),
    );
    const parsed = clientCsvRowSchema.safeParse(row);

    if (!parsed.success) {
      throw new Error(
        `Row ${rowIndex + 2}: ${parsed.error.issues[0]?.message || "Invalid client data."}`,
      );
    }

    return {
      name: parsed.data.name.trim(),
      email: normalizeOptionalText(parsed.data.email),
      phone: normalizeOptionalText(parsed.data.phone),
    };
  });

  const duplicates = parsedRows.reduce<Map<string, number[]>>((acc, row, index) => {
    const key = getClientKey(row);
    const current = acc.get(key) ?? [];
    current.push(index + 2);
    acc.set(key, current);
    return acc;
  }, new Map());

  const duplicateEntry = [...duplicates.entries()].find(
    ([, rowsForClient]) => rowsForClient.length > 1,
  );

  if (duplicateEntry) {
    const duplicateClient = parsedRows[duplicateEntry[1][0] - 2];
    throw new Error(
      `Duplicate client "${duplicateClient?.name}" in rows ${duplicateEntry[1].join(", ")}.`,
    );
  }

  return parsedRows;
}
