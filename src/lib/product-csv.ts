import { z } from "zod";

export const csvHeaders = [
  "name",
  "price",
  "currency",
  "quantity",
  "lowStockThreshold",
] as const;

const csvProductRowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive(),
  currency: z.enum(["USD", "EUR", "PLN"]).default("USD"),
  quantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export type CsvProductInput = z.infer<typeof csvProductRowSchema>;

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

export function buildProductsCsv(
  products: Array<{
    name: string;
    price: { toString(): string };
    currency: string;
    quantity: number;
    lowStockThreshold: number;
  }>,
) {
  const rows = [
    csvHeaders.join(","),
    ...products.map((product) =>
      [
        escapeCsvValue(product.name),
        escapeCsvValue(product.price.toString()),
        escapeCsvValue(product.currency),
        escapeCsvValue(String(product.quantity)),
        escapeCsvValue(String(product.lowStockThreshold)),
      ].join(","),
    ),
  ];

  return rows.join("\r\n");
}

export function parseProductsCsv(csvText: string) {
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
    headers.length !== csvHeaders.length ||
    headers.some((header, index) => header !== csvHeaders[index])
  ) {
    throw new Error(
      `Invalid CSV header. Expected: ${csvHeaders.join(",")}.`,
    );
  }

  const rows = lines.slice(1);

  if (!rows.length) {
    throw new Error("Add at least one product row below the header.");
  }

  const parsedRows = rows.map((line, rowIndex) => {
    const values = splitCsvLine(line);

    if (values.length !== csvHeaders.length) {
      throw new Error(`Row ${rowIndex + 2} has an invalid number of columns.`);
    }

    const row = Object.fromEntries(
      csvHeaders.map((header, index) => [header, values[index]]),
    );

    const parsed = csvProductRowSchema.safeParse(row);

    if (!parsed.success) {
      throw new Error(
        `Row ${rowIndex + 2}: ${parsed.error.issues[0]?.message || "Invalid product data."}`,
      );
    }

    return parsed.data;
  });

  const duplicateNames = parsedRows.reduce<Map<string, number[]>>((acc, row, index) => {
    const key = row.name.toLocaleLowerCase();
    const current = acc.get(key) ?? [];
    current.push(index + 2);
    acc.set(key, current);
    return acc;
  }, new Map());

  const duplicateEntry = [...duplicateNames.entries()].find(([, rowsForName]) => rowsForName.length > 1);

  if (duplicateEntry) {
    throw new Error(
      `Duplicate product name "${parsedRows[duplicateEntry[1][0] - 2]?.name}" in rows ${duplicateEntry[1].join(", ")}.`,
    );
  }

  return parsedRows;
}
