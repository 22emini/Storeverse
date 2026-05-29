import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';

export type CustomerImportFileKind = 'json' | 'csv' | 'excel' | 'pdf' | 'unknown';

const HEADER_ALIASES: Record<string, string> = {
  firstname: 'firstName',
  fname: 'firstName',
  first: 'firstName',
  lastname: 'lastName',
  lname: 'lastName',
  last: 'lastName',
  email: 'email',
  emailaddress: 'email',
  mail: 'email',
  phone: 'phone',
  phonenumber: 'phone',
  mobile: 'phone',
  tel: 'phone',
  telephone: 'phone',
  address: 'address',
  tags: 'tags',
  tag: 'tags',
  notes: 'notes',
  note: 'notes',
  preferedcurrency: 'preferedCurrency',
  preferredcurrency: 'preferedCurrency',
  currency: 'preferedCurrency',
  preferedlanguage: 'preferedLanguage',
  preferredlanguage: 'preferedLanguage',
  language: 'preferedLanguage',
  emailmarketing: 'emailMarketing',
  smsmarketing: 'smsMarketing',
};

const KNOWN_FIELDS = new Set([
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'tags',
  'notes',
  'preferedCurrency',
  'preferedLanguage',
  'emailMarketing',
  'smsMarketing',
]);

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export const detectCustomerImportFileKind = (file: Express.Multer.File): CustomerImportFileKind => {
  const name = file.originalname.toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (name.endsWith('.json') || mime.includes('json')) return 'json';
  if (name.endsWith('.csv') || mime.includes('csv') || mime === 'text/plain') return 'csv';
  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'application/vnd.ms-excel'
  ) {
    return 'excel';
  }
  if (name.endsWith('.pdf') || mime === 'application/pdf') return 'pdf';
  return 'unknown';
};

const normalizeHeaderKey = (header: string): string | null => {
  const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (HEADER_ALIASES[normalized]) return HEADER_ALIASES[normalized];
  if (KNOWN_FIELDS.has(header.trim())) return header.trim();
  return null;
};

export const normalizeCustomerRow = (raw: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val === undefined || val === null || val === '') continue;
    const mapped = normalizeHeaderKey(String(key));
    if (mapped) out[mapped] = val;
  }
  return out;
};

const sheetRowsToCustomers = (rawRows: Record<string, unknown>[]): Record<string, unknown>[] => {
  return rawRows
    .map((row) => normalizeCustomerRow(row))
    .filter((row) => Object.keys(row).length > 0);
};

const parseSpreadsheetBuffer = (buffer: Buffer, kind: 'csv' | 'excel'): Record<string, unknown>[] => {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    raw: false,
    cellDates: false,
  });

  if (workbook.SheetNames.length === 0) {
    throw new Error('Spreadsheet file contains no sheets');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  const rows = sheetRowsToCustomers(rawRows);
  if (rows.length === 0) {
    throw new Error(
      kind === 'csv'
        ? 'CSV file has no data rows. Include a header row (e.g. firstName, email, phone).'
        : 'Excel file has no data rows on the first sheet.'
    );
  }

  return rows;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  result.push(current.trim());
  return result;
};

const splitDelimitedLine = (line: string): string[] => {
  if (line.includes('\t')) return line.split('\t').map((s) => s.trim());
  if ((line.match(/,/g) ?? []).length >= 1) return parseCsvLine(line);
  return line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
};

const rowsFromTableLines = (lines: string[]): Record<string, unknown>[] => {
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return [];

  let headerIndex = -1;
  for (let i = 0; i < Math.min(nonEmpty.length, 30); i++) {
    const lower = nonEmpty[i].toLowerCase();
    if (lower.includes('email') || (lower.includes('first') && lower.includes('name'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex >= 0) {
    const headers = splitDelimitedLine(nonEmpty[headerIndex]).map((h) => normalizeHeaderKey(h));
    const rows: Record<string, unknown>[] = [];

    for (let i = headerIndex + 1; i < nonEmpty.length; i++) {
      const cells = splitDelimitedLine(nonEmpty[i]);
      const row: Record<string, unknown> = {};
      cells.forEach((cell, idx) => {
        const field = headers[idx];
        if (field && cell) row[field] = cell;
      });
      if (Object.keys(row).length > 0) rows.push(row);
    }

    return rows;
  }

  const rows: Record<string, unknown>[] = [];
  for (const line of nonEmpty) {
    const emailMatch = line.match(EMAIL_RE);
    if (!emailMatch) continue;

    const row: Record<string, unknown> = { email: emailMatch[0] };
    const remainder = line.replace(emailMatch[0], '').trim();
    const parts = splitDelimitedLine(remainder).filter(Boolean);

    if (parts.length >= 1) row.firstName = parts[0];
    if (parts.length >= 2) row.lastName = parts[1];
    if (parts.length >= 3 && !row.phone) row.phone = parts[2];

    rows.push(row);
  }

  return rows;
};

const rowsFromPdfTables = (tableResult: { pages: { tables: string[][][] }[] }): Record<string, unknown>[] => {
  const rows: Record<string, unknown>[] = [];

  for (const page of tableResult.pages) {
    for (const table of page.tables) {
      if (table.length < 2) continue;

      const headers = table[0].map((h) => normalizeHeaderKey(String(h ?? '')));
      for (let r = 1; r < table.length; r++) {
        const row: Record<string, unknown> = {};
        table[r].forEach((cell, idx) => {
          const field = headers[idx];
          const value = String(cell ?? '').trim();
          if (field && value) row[field] = value;
        });
        if (Object.keys(row).length > 0) rows.push(row);
      }
    }
  }

  return rows;
};

const parsePdfBuffer = async (buffer: Buffer): Promise<Record<string, unknown>[]> => {
  const parser = new PDFParse({ data: buffer });

  try {
    let rows: Record<string, unknown>[] = [];

    try {
      const tableResult = await parser.getTable();
      rows = rowsFromPdfTables(tableResult);
    } catch {
      rows = [];
    }

    if (rows.length === 0) {
      const textResult = await parser.getText();
      rows = rowsFromTableLines(textResult.text.split(/\r?\n/));
    }

    if (rows.length === 0) {
      throw new Error(
        'Could not extract customer rows from PDF. Use a table export with headers (firstName, email, phone) or a simple text list with emails.'
      );
    }

    return rows;
  } finally {
    await parser.destroy();
  }
};

const parseJsonBuffer = (
  buffer: Buffer
): { rows?: Record<string, unknown>[]; payload?: unknown } => {
  let payload: unknown;
  try {
    payload = JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (Array.isArray(payload)) {
    return {
      rows: payload
        .filter((item) => item && typeof item === 'object')
        .map((item) => normalizeCustomerRow(item as Record<string, unknown>)),
    };
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.customers)) {
      return {
        rows: obj.customers
          .filter((item) => item && typeof item === 'object')
          .map((item) => normalizeCustomerRow(item as Record<string, unknown>)),
        payload: obj,
      };
    }
  }

  throw new Error('JSON must be an array of customers or { storeId, customers }');
};

export type ParsedCustomerImportFile =
  | { rows: Record<string, unknown>[]; storeIdFromFile?: number }
  | { error: string };

export const parseCustomerImportFile = async (
  file: Express.Multer.File
): Promise<ParsedCustomerImportFile> => {
  const kind = detectCustomerImportFileKind(file);

  try {
    if (kind === 'json') {
      const { rows, payload } = parseJsonBuffer(file.buffer);
      if (!rows || rows.length === 0) {
        return { error: 'JSON file contains no customer records' };
      }
      const storeIdFromFile =
        payload && typeof payload === 'object' && 'storeId' in (payload as object)
          ? Number((payload as Record<string, unknown>).storeId)
          : undefined;
      return {
        rows,
        storeIdFromFile: Number.isFinite(storeIdFromFile) ? storeIdFromFile : undefined,
      };
    }

    if (kind === 'csv' || kind === 'excel') {
      const rows = parseSpreadsheetBuffer(file.buffer, kind);
      return { rows };
    }

    if (kind === 'pdf') {
      const rows = await parsePdfBuffer(file.buffer);
      return { rows };
    }

    return {
      error: 'Unsupported file type. Upload JSON, CSV, Excel (.xlsx/.xls), or PDF.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse import file';
    return { error: message };
  }
};
