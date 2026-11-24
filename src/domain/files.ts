/** Uploaded file kinds and the rules every upload must pass. */
export const FILE_KINDS = ['kyc', 'product', 'qc', 'shipping', 'rfq'] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_PHOTOS = 6;

export const ACCEPT_DOCS = 'image/jpeg,image/png,image/webp,application/pdf';
export const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp';

type Sniffer = (b: Uint8Array) => boolean;
const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.subarray(start, end));

/** Allowed MIME types with their extension and a magic-byte check (the browser's type is never trusted alone). */
export const UPLOAD_TYPES: Record<string, { ext: string; sniff: Sniffer }> = {
  'image/jpeg': { ext: '.jpg', sniff: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: '.png', sniff: (b) => b[0] === 0x89 && ascii(b, 1, 4) === 'PNG' },
  'image/webp': { ext: '.webp', sniff: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  'application/pdf': { ext: '.pdf', sniff: (b) => ascii(b, 0, 4) === '%PDF' },
};

/** Detects the real type of a file from its first bytes. */
export function detectType(bytes: Uint8Array): string | undefined {
  return Object.entries(UPLOAD_TYPES).find(([, t]) => t.sniff(bytes))?.[0];
}

export const safeFileName = (name: string, fallback: string) =>
  name
    .trim()
    .slice(0, 120)
    .replace(/[^\w .()-]/g, '_') || fallback;

export const fileSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Labels offered when uploading order documents. */
export const QC_DOC_LABELS = ['QC inspection report', 'Production / packing photo'] as const;
export const SHIPPING_DOC_LABELS = [
  'Bill of lading / AWB',
  'Certificate of origin',
  'Shipping bill / export declaration',
  'Insurance certificate',
  'Other document',
] as const;
export const KYC_DOC_LABELS = [
  'Export registration',
  'Tax registration',
  'Business licence',
  'Factory audit report',
  'Quality certificate',
  'Other',
] as const;
