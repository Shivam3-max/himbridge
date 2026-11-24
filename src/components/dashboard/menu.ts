import type { Role } from '@/domain/roles';

export interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

/** Dashboard sections per account type. */
export const MENUS: Record<Role, MenuItem[]> = {
  buyer: [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/rfqs/new', label: 'Post RFQ', icon: '✚' },
    { href: '/dashboard/rfqs', label: 'My RFQs & Quotes', icon: '☰' },
    { href: '/dashboard/orders', label: 'Orders & Tracking', icon: '⛟' },
    { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
  ],
  vendor: [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/inbox', label: 'RFQ Inbox', icon: '✉' },
    { href: '/dashboard/products', label: 'My Products', icon: '▤' },
    { href: '/dashboard/orders', label: 'Orders & Production', icon: '⛟' },
    { href: '/dashboard/profile', label: 'Company Profile', icon: '◉' },
  ],
  logistics: [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/orders', label: 'Shipments', icon: '⛴' },
    { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
  ],
  admin: [
    { href: '/dashboard', label: 'Control Room', icon: '▦' },
    { href: '/dashboard/admin/vendors', label: 'Vendor Verification', icon: '✔' },
    { href: '/dashboard/orders', label: 'Orders & Payments', icon: '⛟' },
    { href: '/dashboard/rfqs', label: 'RFQs', icon: '☰' },
    { href: '/dashboard/admin/users', label: 'Users', icon: '☺' },
    { href: '/dashboard/admin/notices', label: 'Notices', icon: '✎' },
    { href: '/dashboard/admin/outbox', label: 'Email Outbox', icon: '✆' },
    { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
  ],
};
