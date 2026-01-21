
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { OrderStatus, OrderItemSummary } from '../../types/database';
import { useNotification } from '../../components/NotificationProvider';
import { 
  Search, 
  ChevronRight, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle,
  PackageSearch,
  Activity,
  History,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, showToast } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`*`)
        .order('created_at', { ascending: false });
      
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      if (orderData && profiles) {
        const enrichedOrders = orderData.map(o => ({
          ...o,
          profile: profiles.find(p => p.id === o.user_id) || null
        }));
        setOrders(enrichedOrders);
      }
    } catch (err) {
      console.error("Fetch Orders Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    const isConfirmed = await confirm("Change Status", `Mark order as ${newStatus}?`);
    if (!isConfirmed) return;

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      showToast('success', 'Order status updated');

      if (newStatus === 'Delivered') {
        const order = orders.find(o => o.id === id);
        if (order && order.items_summary) {
          const items = order.items_summary as OrderItemSummary[];
          for (const item of items) {
             const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
             if (prod) {
                await supabase.from('products').update({ stock_quantity: Math.max(0, prod.stock_quantity - item.quantity) }).eq('id', item.product_id);
             }
          }
        }
      }
    } else {
      showToast('error', 'Status update failed.');
    }
  };

  const activeOrders = orders.filter(o => ['Placed', 'Accepted', 'Shipped'].includes(o.status) && 
    (o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase())));

  const pastOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status) && 
    (o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase())));

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Placed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Accepted': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Shipped': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const OrderRow: React.FC<{ order: any }> = ({ order }) => {
    const items = (order.items_summary || []) as OrderItemSummary[];
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-4">
        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg border ${getStatusStyle(order.status)}`}>
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Order ID</p>
              <h3 className="font-bold text-gray-900 mt-1 uppercase">#{order.id.slice(0, 8)}</h3>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-right hidden md:block">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
               <p className="font-bold text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
            </div>
            <select 
              value={order.status}
              onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
              className="flex-grow md:flex-grow-0 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-bold bg-white focus:ring-1 focus:ring-blue-500 uppercase tracking-wider outline-none"
            >
              <option value="Placed">Placed</option>
              <option value="Accepted">Accepted</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
             <p className="text-sm font-bold text-gray-900">{order.profile?.name || 'Guest'}</p>
             <p className="text-xs text-gray-500">{order.profile?.phone || order.address?.phone}</p>
          </div>
          <div className="md:col-span-2">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items</p>
             <div className="flex flex-wrap gap-1.5">
                {items.map((i, idx) => (
                  <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-medium text-gray-600">
                    {i.name} (x{i.quantity})
                  </span>
                ))}
             </div>
          </div>
          <div className="md:col-span-1 flex justify-end">
             <Link to={`/my-orders/${order.id}`} className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
               Full Details <ChevronRight className="w-3 h-3" />
             </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review shipments and update delivery statuses.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Order ID or Customer..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>
      </div>

      <div className="space-y-10">
        <section>
           <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Active Orders
           </h2>
           {activeOrders.map(order => <OrderRow key={order.id} order={order} />)}
           {activeOrders.length === 0 && <p className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed text-sm">No active orders found.</p>}
        </section>

        <section>
           <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" /> Past History
           </h2>
           {pastOrders.map(order => <OrderRow key={order.id} order={order} />)}
           {pastOrders.length === 0 && <p className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed text-sm">No historical records found.</p>}
        </section>
      </div>
    </div>
  );
};

export default AdminOrders;
