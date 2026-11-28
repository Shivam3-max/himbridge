export const ROLES = ['admin', 'buyer', 'vendor', 'logistics'] as const;
export type Role = (typeof ROLES)[number];

/** Roles a visitor may choose when registering (admins are created by the team). */
export const SELF_SERVICE_ROLES = ['buyer', 'vendor', 'logistics'] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  buyer: 'Buyer',
  vendor: 'Manufacturer / Vendor',
  logistics: 'Logistics Partner',
  admin: 'Himbridge Administrator',
};

export const VENDOR_STATUSES = ['pending', 'verified', 'suspended'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const isRole = (v: unknown): v is Role => typeof v === 'string' && (ROLES as readonly string[]).includes(v);
