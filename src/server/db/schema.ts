import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());
/** Money in USD, two decimals, read back as a JS number. */
const money = (name: string) => numeric(name, { precision: 14, scale: 2, mode: 'number' });

// ─────────────────────────────────────────────────────────────
// Identity — tables used by Better Auth (src/server/auth/auth.ts).
// Field names must match what Better Auth expects.
// ─────────────────────────────────────────────────────────────

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: text('role', { enum: ['admin', 'buyer', 'vendor', 'logistics'] })
      .notNull()
      .default('buyer'),
    company: text('company').notNull().default(''),
    country: text('country').notNull().default(''),
    phone: text('phone').notNull().default(''),
    /** Buyers only: brand / designer / importer (see src/domain/sourcing.ts). Empty for other roles. */
    buyerType: text('buyer_type').notNull().default(''),
    /** Buyers of type "other": what they want to source, in their own words. */
    buyerNote: text('buyer_note').notNull().default(''),
    /** "active" accounts can sign in; "disabled" accounts are blocked. */
    status: text('status', { enum: ['active', 'disabled'] })
      .notNull()
      .default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('user_role_idx').on(t.role)],
);

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('session_user_idx').on(t.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('account_user_idx').on(t.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);

// ─────────────────────────────────────────────────────────────
// Trade domain
// ─────────────────────────────────────────────────────────────

export const vendorProfile = pgTable(
  'vendor_profile',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    cluster: text('cluster').notNull().default(''),
    niche: text('niche').notNull(),
    certifications: text('certifications').notNull().default(''),
    capacity: text('capacity').notNull().default(''),
    years: integer('years').notNull().default(0),
    about: text('about').notNull().default(''),
    verification: text('verification', { enum: ['pending', 'verified', 'suspended'] })
      .notNull()
      .default('pending'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('vendor_verification_idx').on(t.verification)],
);

export const product = pgTable(
  'product',
  {
    id: serial('id').primaryKey(),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    niche: text('niche').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    hsCode: text('hs_code').notNull().default(''),
    moq: integer('moq').notNull(),
    unit: text('unit').notNull().default('pcs'),
    priceMin: money('price_min').notNull(),
    priceMax: money('price_max').notNull(),
    leadDays: integer('lead_days').notNull(),
    material: text('material').notNull().default(''),
    status: text('status', { enum: ['active', 'hidden'] })
      .notNull()
      .default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('product_vendor_idx').on(t.vendorId),
    index('product_niche_idx').on(t.niche),
    check('product_price_range', sql`${t.priceMax} >= ${t.priceMin}`),
  ],
);

export const rfq = pgTable(
  'rfq',
  {
    id: serial('id').primaryKey(),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    niche: text('niche').notNull(),
    title: text('title').notNull(),
    details: text('details').notNull().default(''),
    quantity: integer('quantity').notNull(),
    unit: text('unit').notNull().default('pcs'),
    destination: text('destination').notNull(),
    targetPrice: money('target_price'),
    incoterm: text('incoterm').notNull().default('FOB'),
    deliverBy: date('deliver_by', { mode: 'string' }),
    samplesNeeded: boolean('samples_needed').notNull().default(false),
    status: text('status', { enum: ['open', 'awarded', 'closed'] })
      .notNull()
      .default('open'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('rfq_buyer_idx').on(t.buyerId), index('rfq_status_idx').on(t.status)],
);

export const quote = pgTable(
  'quote',
  {
    id: serial('id').primaryKey(),
    rfqId: integer('rfq_id')
      .notNull()
      .references(() => rfq.id, { onDelete: 'cascade' }),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    unitPrice: money('unit_price').notNull(),
    leadDays: integer('lead_days').notNull(),
    note: text('note').notNull().default(''),
    status: text('status', { enum: ['submitted', 'accepted', 'rejected'] })
      .notNull()
      .default('submitted'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('quote_rfq_vendor_uq').on(t.rfqId, t.vendorId)],
);

export const order = pgTable(
  'trade_order',
  {
    id: serial('id').primaryKey(),
    code: text('code').unique(),
    rfqId: integer('rfq_id').references(() => rfq.id, { onDelete: 'set null' }),
    quoteId: integer('quote_id').references(() => quote.id, { onDelete: 'set null' }),
    sourcingId: integer('sourcing_id').references(() => sourcingRequest.id, { onDelete: 'set null' }),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => user.id),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => user.id),
    logisticsId: text('logistics_id').references(() => user.id),
    title: text('title').notNull(),
    quantity: integer('quantity').notNull(),
    unit: text('unit').notNull().default('pcs'),
    unitPrice: money('unit_price').notNull(),
    total: money('total').notNull(),
    destination: text('destination').notNull().default(''),
    incoterm: text('incoterm').notNull().default('FOB'),
    mode: text('mode').notNull().default(''),
    originPort: text('origin_port').notNull().default(''),
    destPort: text('dest_port').notNull().default(''),
    status: text('status', {
      enum: ['confirmed', 'in_production', 'qc_passed', 'shipped', 'customs', 'delivered'],
    })
      .notNull()
      .default('confirmed'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('order_buyer_idx').on(t.buyerId), index('order_vendor_idx').on(t.vendorId), index('order_logistics_idx').on(t.logisticsId)],
);

export const milestone = pgTable(
  'milestone',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    note: text('note').notNull().default(''),
    byUserId: text('by_user_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('milestone_order_idx').on(t.orderId)],
);

export const payment = pgTable(
  'payment',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => order.id, { onDelete: 'cascade' }),
    stage: text('stage', { enum: ['advance', 'balance'] }).notNull(),
    pct: integer('pct').notNull(),
    amount: money('amount').notNull(),
    status: text('status', { enum: ['due', 'submitted', 'received'] })
      .notNull()
      .default('due'),
    reference: text('reference').notNull().default(''),
    confirmedById: text('confirmed_by_id').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('payment_order_stage_uq').on(t.orderId, t.stage)],
);

export const notice = pgTable('notice', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  tag: text('tag').notNull().default('Notice'),
  createdAt: createdAt(),
});

/** Uploaded files. The bytes live in the storage driver (local disk or S3) under `storageKey`. */
export const file = pgTable(
  'file',
  {
    id: serial('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['kyc', 'product', 'qc', 'shipping', 'rfq', 'sourcing'] }).notNull(),
    refId: integer('ref_id'),
    label: text('label').notNull().default(''),
    name: text('name').notNull(),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [index('file_kind_ref_idx').on(t.kind, t.refId), index('file_owner_idx').on(t.ownerId)],
);

/** Every email the portal sends is recorded here (Admin → Email outbox), whether or not SMTP is configured. */
export const emailOutbox = pgTable('email_outbox', {
  id: serial('id').primaryKey(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: ['logged', 'sent', 'failed'] })
    .notNull()
    .default('logged'),
  error: text('error'),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────
// Sourcing desk (small brands, designers, importers) — see src/domain/sourcing.ts
// ─────────────────────────────────────────────────────────────

export const sourcingRequest = pgTable(
  'sourcing_request',
  {
    id: serial('id').primaryKey(),
    code: text('code').unique(),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['source', 'manufacture', 'project'] }).notNull(),
    niche: text('niche').notNull(),
    title: text('title').notNull(),
    brief: text('brief').notNull().default(''),
    storeUrl: text('store_url').notNull().default(''),
    destination: text('destination').notNull(),
    deliverBy: date('deliver_by', { mode: 'string' }),
    shipping: text('shipping').notNull().default('advise'),
    terms: text('terms').notNull().default('DDP'),
    reorder: text('reorder').notNull().default('one_off'),
    samplesNeeded: boolean('samples_needed').notNull().default(true),
    privateLabel: boolean('private_label').notNull().default(false),
    customPackaging: boolean('custom_packaging').notNull().default(false),
    stage: text('stage', { enum: ['submitted', 'matching', 'offers', 'sampling', 'ordered', 'closed'] })
      .notNull()
      .default('submitted'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('sourcing_buyer_idx').on(t.buyerId), index('sourcing_stage_idx').on(t.stage)],
);

export const sourcingItem = pgTable(
  'sourcing_item',
  {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
      .notNull()
      .references(() => sourcingRequest.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    name: text('name').notNull(),
    spec: text('spec').notNull().default(''),
    referenceUrl: text('reference_url').notNull().default(''),
    quantity: integer('quantity').notNull(),
    unit: text('unit').notNull().default('pcs'),
    currentPrice: money('current_price'),
    targetPrice: money('target_price'),
    retailPrice: money('retail_price'),
  },
  (t) => [index('sourcing_item_req_idx').on(t.requestId)],
);

export const sourcingOffer = pgTable(
  'sourcing_offer',
  {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
      .notNull()
      .references(() => sourcingRequest.id, { onDelete: 'cascade' }),
    vendorId: text('vendor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    moq: integer('moq').notNull(),
    leadDays: integer('lead_days').notNull(),
    samplePrice: money('sample_price'),
    sampleDays: integer('sample_days'),
    note: text('note').notNull().default(''),
    status: text('status', { enum: ['submitted', 'sample_requested', 'accepted', 'declined'] })
      .notNull()
      .default('submitted'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('sourcing_offer_req_vendor_uq').on(t.requestId, t.vendorId)],
);

export const sourcingOfferLine = pgTable(
  'sourcing_offer_line',
  {
    offerId: integer('offer_id')
      .notNull()
      .references(() => sourcingOffer.id, { onDelete: 'cascade' }),
    itemId: integer('item_id')
      .notNull()
      .references(() => sourcingItem.id, { onDelete: 'cascade' }),
    unitPrice: money('unit_price').notNull(),
  },
  (t) => [primaryKey({ columns: [t.offerId, t.itemId] })],
);

/** Conversation between the buyer and the Himbridge sourcing desk on one request. */
export const sourcingMessage = pgTable(
  'sourcing_message',
  {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
      .notNull()
      .references(() => sourcingRequest.id, { onDelete: 'cascade' }),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('sourcing_message_req_idx').on(t.requestId)],
);

// ─────────────────────────────────────────────────────────────
// Export readiness & services — see src/domain/export-readiness.ts
// ─────────────────────────────────────────────────────────────

export const vendorCompliance = pgTable(
  'vendor_compliance',
  {
    vendorId: text('vendor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    itemKey: text('item_key').notNull(),
    status: text('status', { enum: ['missing', 'in_progress', 'done', 'na'] })
      .notNull()
      .default('missing'),
    reference: text('reference').notNull().default(''),
    expiresOn: date('expires_on', { mode: 'string' }),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.vendorId, t.itemKey] })],
);

export const serviceRequest = pgTable(
  'service_request',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    service: text('service').notNull(),
    note: text('note').notNull().default(''),
    status: text('status', { enum: ['new', 'in_progress', 'done', 'cancelled'] })
      .notNull()
      .default('new'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('service_request_user_idx').on(t.userId), index('service_request_status_idx').on(t.status)],
);

// ─────────────────────────────────────────────────────────────
// Relations (for typed relational queries)
// ─────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ one }) => ({
  vendorProfile: one(vendorProfile, { fields: [user.id], references: [vendorProfile.userId] }),
}));
export const vendorProfileRelations = relations(vendorProfile, ({ one }) => ({
  user: one(user, { fields: [vendorProfile.userId], references: [user.id] }),
}));
export const orderRelations = relations(order, ({ many }) => ({
  milestones: many(milestone),
  payments: many(payment),
}));
export const milestoneRelations = relations(milestone, ({ one }) => ({
  order: one(order, { fields: [milestone.orderId], references: [order.id] }),
}));
export const paymentRelations = relations(payment, ({ one }) => ({
  order: one(order, { fields: [payment.orderId], references: [order.id] }),
}));
