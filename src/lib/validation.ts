import { z } from 'zod';
import { NICHE_SLUGS } from '@/domain/niches';
import { INCOTERMS, ORDER_STATUSES } from '@/domain/order-flow';
import { SELF_SERVICE_ROLES, VENDOR_STATUSES } from '@/domain/roles';

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

export const registerSchema = z
  .object({
    role: z.enum(SELF_SERVICE_ROLES, { message: 'Choose an account type' }),
    name: requiredText(120, 'Name, company and country are required'),
    company: requiredText(160, 'Name, company and country are required'),
    country: requiredText(80, 'Name, company and country are required'),
    email,
    phone: text(40),
    password,
    agree: z.literal('on', { message: 'Please accept the Terms of Use to continue.' }),
    niche: z.string().optional(),
    cluster: text(120),
    certifications: text(300),
    capacity: text(120),
    years: z.preprocess((v) => (v === '' || v == null ? 0 : v), z.coerce.number().int().min(0).max(500)),
    about: text(1000),
  })
  .superRefine((v, ctx) => {
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
