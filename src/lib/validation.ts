import { z } from 'zod';
import { NICHE_SLUGS } from '@/domain/niches';
import { INCOTERMS, ORDER_STATUSES } from '@/domain/order-flow';
import { SELF_SERVICE_ROLES, VENDOR_STATUSES } from '@/domain/roles';
import { READINESS_STATUSES, SERVICE_STATUSES, SERVICES } from '@/domain/export-readiness';
import { BUYER_TYPES, DELIVERY_TERMS, REORDER_PLANS, REQUEST_KINDS, SHIPPING_PREFS, SOURCING_STAGES } from '@/domain/sourcing';

/** Input schemas shared by server actions. Messages are English source strings (translated by runAction). */

const text = (max: number) => z.string().trim().max(max).default('');
const requiredText = (max: number, message: string) => z.string().trim().min(1, message).max(max);
const positiveInt = (message: string) => z.coerce.number({ message }).int(message).positive(message);
const positiveNum = (message: string) => z.coerce.number({ message }).positive(message);
const optionalPositiveNum = (message: string) =>
  z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number({ message }).positive(message).nullable());

export const email = z.string().trim().toLowerCase().email('Enter a valid email');
export const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const niche = z.enum(NICHE_SLUGS, { message: 'Choose a niche' });
const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
const optionalDate = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
    .nullable(),
);
const link = z
  .string()
  .trim()
  .max(500)
  .default('')
  .refine((v) => v === '' || /^https?:\/\/\S+\.\S+/.test(v), 'Links must start with http:// or https://');
/** A JSON-encoded array field (repeating rows built on the client). */
const jsonArray = <T extends z.ZodTypeAny>(item: T, min: number, max: number, message: string) =>
  z.preprocess(
    (v) => {
      try {
        return typeof v === 'string' ? JSON.parse(v) : v;
      } catch {
        return [];
      }
    },
    z.array(item).min(min, message).max(max, message),
  );

export const registerSchema = z
  .object({
    role: z.enum(SELF_SERVICE_ROLES, { message: 'Choose an account type' }),
    name: requiredText(120, 'Name, company and country are required'),
    company: requiredText(160, 'Name, company and country are required'),
    country: requiredText(80, 'Name, company and country are required'),
    email,
    phone: text(40),
    buyerType: z.enum(BUYER_TYPES).optional().catch(undefined),
    buyerNote: text(500),
    /** Optional: when left blank, a secure password is generated and shown once after sign-up. */
    password: z.preprocess((v) => (v === '' || v == null ? undefined : v), password.optional()),
    agree: z.literal('on', { message: 'Please accept the Terms of Use to continue.' }),
    niche: z.string().optional(),
    cluster: text(120),
    certifications: text(300),
    capacity: text(120),
    years: z.preprocess((v) => (v === '' || v == null ? 0 : v), z.coerce.number().int().min(0).max(500)),
    about: text(1000),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'buyer' && v.buyerType === 'other' && !v.buyerNote)
      ctx.addIssue({ code: 'custom', path: ['buyerNote'], message: 'Tell us what you would like to source' });
    if (v.role !== 'vendor') return;
    if (!v.niche || !(NICHE_SLUGS as string[]).includes(v.niche))
      ctx.addIssue({ code: 'custom', path: ['niche'], message: 'Choose your primary niche' });
  });

export const productSchema = z
  .object({
    title: requiredText(200, 'Product title is required'),
    niche,
    description: text(1000),
    hsCode: text(20),
    moq: positiveInt('MOQ must be a positive number'),
    unit: z
      .string()
      .trim()
      .max(20)
      .default('pcs')
      .transform((u) => u || 'pcs'),
    priceMin: positiveNum('Enter a valid FOB price range (max ≥ min)'),
    priceMax: positiveNum('Enter a valid FOB price range (max ≥ min)'),
    leadDays: positiveInt('Lead time must be a positive number of days'),
    material: text(120),
  })
  .refine((v) => v.priceMax >= v.priceMin, { message: 'Enter a valid FOB price range (max ≥ min)' });

export const rfqSchema = z.object({
  title: requiredText(200, 'Title and destination are required'),
  destination: requiredText(120, 'Title and destination are required'),
  niche,
  quantity: positiveInt('Quantity must be a positive number'),
  unit: z
    .string()
    .trim()
    .max(20)
    .default('pcs')
    .transform((u) => u || 'pcs'),
  targetPrice: optionalPositiveNum('Target price must be positive'),
  details: text(2000),
  incoterm: z.enum(INCOTERMS).catch('FOB'),
  deliverBy: optionalDate,
  samplesNeeded: checkbox,
});

export const quoteSchema = z.object({
  unitPrice: positiveNum('Enter a valid unit price and lead time'),
  leadDays: positiveInt('Enter a valid unit price and lead time'),
  note: text(1000),
});

export const milestoneSchema = z.object({
  status: z.enum(ORDER_STATUSES, { message: 'Unknown status' }),
  note: text(500),
});

export const assignLogisticsSchema = z.object({
  logisticsId: z.string().min(1, 'Choose a logistics partner'),
  incoterm: z.enum(INCOTERMS).catch('FOB'),
  mode: text(80),
  originPort: text(80),
  destPort: text(80),
});

export const paymentReferenceSchema = z.object({
  reference: requiredText(80, 'Enter the bank / SWIFT / LC reference'),
});

export const noticeSchema = z.object({
  title: requiredText(200, 'Title is required'),
  body: text(2000),
  tag: z
    .string()
    .trim()
    .max(30)
    .default('Notice')
    .transform((v) => v || 'Notice'),
});

export const vendorStatusSchema = z.enum(VENDOR_STATUSES, { message: 'Unknown status' });

export const changePasswordSchema = z
  .object({ current: z.string().min(1, 'Current password is incorrect'), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'The new passwords do not match.' });

export const resetPasswordSchema = z
  .object({ token: z.string().min(1), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'The two passwords do not match.' });

// ── Sourcing desk ────────────────────────────────────────────

const unit = z
  .string()
  .trim()
  .max(20)
  .default('pcs')
  .transform((u) => u || 'pcs');

export const sourcingItemSchema = z.object({
  name: requiredText(160, 'Every item needs a name'),
  spec: text(1000),
  referenceUrl: link,
  quantity: positiveInt('Every item needs a quantity'),
  unit,
  currentPrice: optionalPositiveNum('Prices must be positive numbers'),
  targetPrice: optionalPositiveNum('Prices must be positive numbers'),
  retailPrice: optionalPositiveNum('Prices must be positive numbers'),
});

export const sourcingSchema = z.object({
  kind: z.enum(REQUEST_KINDS, { message: 'Choose what you need' }),
  niche,
  title: requiredText(200, 'Give your request a name'),
  brief: text(3000),
  storeUrl: link,
  destination: requiredText(120, 'Where should we deliver?'),
  deliverBy: optionalDate,
  shipping: z.enum(SHIPPING_PREFS).catch('advise'),
  terms: z.enum(DELIVERY_TERMS).catch('DDP'),
  reorder: z.enum(REORDER_PLANS).catch('one_off'),
  samplesNeeded: checkbox,
  privateLabel: checkbox,
  customPackaging: checkbox,
  items: jsonArray(sourcingItemSchema, 1, 30, 'Add between 1 and 30 items'),
});

export const offerSchema = z.object({
  moq: positiveInt('Enter your minimum order quantity'),
  leadDays: positiveInt('Enter a production lead time in days'),
  samplePrice: optionalPositiveNum('Sample price must be positive'),
  sampleDays: z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().int().positive().nullable()),
  note: text(1500),
  prices: jsonArray(
    z.object({ itemId: z.coerce.number().int().positive(), unitPrice: positiveNum('Enter a unit price for every item') }),
    1,
    30,
    'Price at least one item',
  ),
});

export const messageSchema = z.object({ body: requiredText(2000, 'Write a message first') });
export const sourcingStageSchema = z.enum(SOURCING_STAGES, { message: 'Unknown stage' });

export const complianceSchema = z.object({
  status: z.enum(READINESS_STATUSES, { message: 'Unknown status' }),
  reference: text(120),
  expiresOn: optionalDate,
});

export const serviceRequestSchema = z.object({
  service: z.enum(SERVICES.map((s) => s.key) as [string, ...string[]], { message: 'Choose a service' }),
  note: text(1500),
});
export const serviceStatusSchema = z.enum(SERVICE_STATUSES, { message: 'Unknown status' });
