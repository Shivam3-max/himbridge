import type { Role } from '@/domain/roles';

export interface MenuItem {
  href: string;
  label: string;
  icon: string;
  /** Heading shown above the first item of each group. */
  section?: string;
}

/** Dashboard sections per account type, grouped so the most common jobs sit at the top. */
export const MENUS: Record<Role, MenuItem[]> = {
  buyer: [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/sourcing/new', label: 'Start sourcing', icon: '✚', section: 'Source from India' },
    { href: '/dashboard/sourcing', label: 'My sourcing projects', icon: '◈', section: 'Source from India' },
    { href: '/dashboard/services', label: 'Samples & services', icon: '✦', section: 'Source from India' },
    { href: '/dashboard/rfqs/new', label: 'Post bulk RFQ', icon: '✚', section: 'Bulk & container orders' },
    { href: '/dashboard/rfqs', label: 'My RFQs & quotes', icon: '☰', section: 'Bulk & container orders' },
    { href: '/dashboard/orders', label: 'Orders & tracking', icon: '⛟', section: 'Orders' },
    { href: '/tools', label: 'Landed cost & HS codes', icon: '∑', section: 'Orders' },
    { href: '/dashboard/profile', label: 'Profile', icon: '◉', section: 'Account' },
  ],
  vendor: [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/sourcing', label: 'Sourcing requests', icon: '◈', section: 'Win buyers' },
    { href: '/dashboard/inbox', label: 'Bulk RFQ inbox', icon: '✉', section: 'Win buyers' },
    { href: '/dashboard/products', label: 'My products', icon: '▤', section: 'Win buyers' },
    { href: '/dashboard/orders', label: 'Orders & production', icon: '⛟', section: 'Deliver' },
    { href: '/dashboard/readiness', label: 'Export readiness', icon: '✔', section: 'Grow' },
    { href: '/dashboard/services', label: 'Export services', icon: '✦', section: 'Grow' },
    { href: '/dashboard/profile', label: 'Company profile', icon: '◉', section: 'Account' },
  ],
  logistics: [
    { href: '/dashboard', label: 'Overview', icon: '▦' },
    { href: '/dashboard/orders', label: 'Shipments', icon: '⛴' },
    { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
  ],
  admin: [
    { href: '/dashboard', label: 'Control Room', icon: '▦' },
    { href: '/dashboard/sourcing', label: 'Sourcing desk', icon: '◈', section: 'Buyers' },
    { href: '/dashboard/rfqs', label: 'RFQs', icon: '☰', section: 'Buyers' },
    { href: '/dashboard/orders', label: 'Orders & payments', icon: '⛟', section: 'Buyers' },
    { href: '/dashboard/admin/vendors', label: 'Vendor verification', icon: '✔', section: 'Manufacturers' },
    { href: '/dashboard/readiness', label: 'Export readiness', icon: '◔', section: 'Manufacturers' },
    { href: '/dashboard/services', label: 'Service requests', icon: '✦', section: 'Manufacturers' },
    { href: '/dashboard/admin/users', label: 'Users', icon: '☺', section: 'Platform' },
    { href: '/dashboard/admin/notices', label: 'Notices', icon: '✎', section: 'Platform' },
    { href: '/dashboard/admin/outbox', label: 'Email outbox', icon: '✆', section: 'Platform' },
    { href: '/dashboard/profile', label: 'Profile', icon: '◉', section: 'Platform' },
  ],
};
