import { OrderCard } from '@/components/dashboard/orders';
import { Empty } from '@/components/ui/primitives';
import { requirePageUser } from '@/server/auth/session';
import { listLogisticsPartners, listOrders } from '@/server/services/orders';

export const metadata = { title: 'Orders' };

const EMPTY_TEXT = {
  buyer: 'No orders yet. Accept a quotation to create an order.',
  vendor: 'No orders yet. Win RFQs to receive orders.',
  logistics: 'No shipments assigned yet. Himbridge operations will assign confirmed orders to you.',
  admin: 'No orders yet.',
} as const;

export default async function OrdersPage() {
  const me = await requirePageUser('/dashboard/orders');
  const [orders, partners] = await Promise.all([listOrders(me), me.role === 'admin' ? listLogisticsPartners() : Promise.resolve([])]);
  if (!orders.length) return <Empty>{EMPTY_TEXT[me.role]}</Empty>;
  return orders.map((o) => <OrderCard key={o.id} order={o} viewer={{ id: me.id, role: me.role }} partners={partners} />);
}
