"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCustomerImportFile = exports.normalizeCustomerRow = exports.detectCustomerImportFileKind = void 0;
const XLSX = __importStar(require("xlsx"));
const pdf_parse_1 = require("pdf-parse");
const HEADER_ALIASES = {
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
const detectCustomerImportFileKind = (file) => {
    const name = file.originalname.toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (name.endsWith('.json') || mime.includes('json'))
        return 'json';
    if (name.endsWith('.csv') || mime.includes('csv') || mime === 'text/plain')
        return 'csv';
    if (name.endsWith('.xlsx') ||
        name.endsWith('.xls') ||
        mime.includes('spreadsheet') ||
        mime.includes('excel') ||
        mime === 'application/vnd.ms-excel') {
        return 'excel';
    }
    if (name.endsWith('.pdf') || mime === 'application/pdf')
        return 'pdf';
    return 'unknown';
};
exports.detectCustomerImportFileKind = detectCustomerImportFileKind;
const normalizeHeaderKey = (header) => {
    const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (HEADER_ALIASES[normalized])
        return HEADER_ALIASES[normalized];
    if (KNOWN_FIELDS.has(header.trim()))
        return header.trim();
    return null;
};
const normalizeCustomerRow = (raw) => {
    const out = {};
    for (const [key, val] of Object.entries(raw)) {
        if (val === undefined || val === null || val === '')
            continue;
        const mapped = normalizeHeaderKey(String(key));
        if (mapped)
            out[mapped] = val;
    }
    return out;
};
exports.normalizeCustomerRow = normalizeCustomerRow;
const sheetRowsToCustomers = (rawRows) => {
    return rawRows
        .map((row) => (0, exports.normalizeCustomerRow)(row))
        .filter((row) => Object.keys(row).length > 0);
};
const parseSpreadsheetBuffer = (buffer, kind) => {
    const workbook = XLSX.read(buffer, {
        type: 'buffer',
        raw: false,
        cellDates: false,
    });
    if (workbook.SheetNames.length === 0) {
        throw new Error('Spreadsheet file contains no sheets');
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
    });
    const rows = sheetRowsToCustomers(rawRows);
    if (rows.length === 0) {
        throw new Error(kind === 'csv'
            ? 'CSV file has no data rows. Include a header row (e.g. firstName, email, phone).'
            : 'Excel file has no data rows on the first sheet.');
    }
    return rows;
};
const parseCsvLine = (line) => {
    const result = [];
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
const splitDelimitedLine = (line) => {
    if (line.includes('\t'))
        return line.split('\t').map((s) => s.trim());
    if ((line.match(/,/g) ?? []).length >= 1)
        return parseCsvLine(line);
    return line.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean);
};
const rowsFromTableLines = (lines) => {
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
    if (nonEmpty.length === 0)
        return [];
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
        const rows = [];
        for (let i = headerIndex + 1; i < nonEmpty.length; i++) {
            const cells = splitDelimitedLine(nonEmpty[i]);
            const row = {};
            cells.forEach((cell, idx) => {
                const field = headers[idx];
                if (field && cell)
                    row[field] = cell;
            });
            if (Object.keys(row).length > 0)
                rows.push(row);
        }
        return rows;
    }
    const rows = [];
    for (const line of nonEmpty) {
        const emailMatch = line.match(EMAIL_RE);
        if (!emailMatch)
            continue;
        const row = { email: emailMatch[0] };
        const remainder = line.replace(emailMatch[0], '').trim();
        const parts = splitDelimitedLine(remainder).filter(Boolean);
        if (parts.length >= 1)
            row.firstName = parts[0];
        if (parts.length >= 2)
            row.lastName = parts[1];
        if (parts.length >= 3 && !row.phone)
            row.phone = parts[2];
        rows.push(row);
    }
    return rows;
};
const rowsFromPdfTables = (tableResult) => {
    const rows = [];
    for (const page of tableResult.pages) {
        for (const table of page.tables) {
            if (table.length < 2)
                continue;
            const headers = table[0].map((h) => normalizeHeaderKey(String(h ?? '')));
            for (let r = 1; r < table.length; r++) {
                const row = {};
                table[r].forEach((cell, idx) => {
                    const field = headers[idx];
                    const value = String(cell ?? '').trim();
                    if (field && value)
                        row[field] = value;
                });
                if (Object.keys(row).length > 0)
                    rows.push(row);
            }
        }
    }
    return rows;
};
const parsePdfBuffer = async (buffer) => {
    const parser = new pdf_parse_1.PDFParse({ data: buffer });
    try {
        let rows = [];
        try {
            const tableResult = await parser.getTable();
            rows = rowsFromPdfTables(tableResult);
        }
        catch {
            rows = [];
        }
        if (rows.length === 0) {
            const textResult = await parser.getText();
            rows = rowsFromTableLines(textResult.text.split(/\r?\n/));
        }
        if (rows.length === 0) {
            throw new Error('Could not extract customer rows from PDF. Use a table export with headers (firstName, email, phone) or a simple text list with emails.');
        }
        return rows;
    }
    finally {
        await parser.destroy();
    }
};
const parseJsonBuffer = (buffer) => {
    let payload;
    try {
        payload = JSON.parse(buffer.toString('utf-8'));
    }
    catch {
        throw new Error('Invalid JSON file');
    }
    if (Array.isArray(payload)) {
        return {
            rows: payload
                .filter((item) => item && typeof item === 'object')
                .map((item) => (0, exports.normalizeCustomerRow)(item)),
        };
    }
    if (payload && typeof payload === 'object') {
        const obj = payload;
        if (Array.isArray(obj.customers)) {
            return {
                rows: obj.customers
                    .filter((item) => item && typeof item === 'object')
                    .map((item) => (0, exports.normalizeCustomerRow)(item)),
                payload: obj,
            };
        }
    }
    throw new Error('JSON must be an array of customers or { storeId, customers }');
};
const parseCustomerImportFile = async (file) => {
    const kind = (0, exports.detectCustomerImportFileKind)(file);
    try {
        if (kind === 'json') {
            const { rows, payload } = parseJsonBuffer(file.buffer);
            if (!rows || rows.length === 0) {
                return { error: 'JSON file contains no customer records' };
            }
            const storeIdFromFile = payload && typeof payload === 'object' && 'storeId' in payload
                ? Number(payload.storeId)
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse import file';
        return { error: message };
    }
};
exports.parseCustomerImportFile = parseCustomerImportFile;
