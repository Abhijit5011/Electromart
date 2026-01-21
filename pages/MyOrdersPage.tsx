import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, getImageUrl } from '../lib/supabase';
import { useAuth } from '../App';
import { Order } from '../types/database';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, ShoppingBag, Loader2 } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';

const OrderCard: React.FC<{ order: any; onCancel: (id: string) => void }> = ({ order, onCancel }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow mb-4">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Order ID</p>
          <h3 className="font-bold text-gray-900 mt-1 uppercase text-sm">#{order.id.slice(0, 8)}</h3>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${
          order.status === 'Placed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
          order.status === 'Accepted' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          order.status === 'Shipped' ? 'bg-orange-50 text-orange-600 border-orange-100' :
          order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {order.status === 'Placed' && <Clock className="w-3 h-3" />}
          {order.status === 'Accepted' && <CheckCircle2 className="w-3 h-3" />}
          {order.status === 'Shipped' && <Truck className="w-3 h-3" />}
          {order.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
          {order.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
          {order.status}
        </span>
        <span className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex -space-x-3 overflow-hidden">
        {order.items_summary?.slice(0, 3).map((item: any, idx: number) => (
          <div key={idx} className="w-10 h-10 bg-white rounded-full border border-gray-200 p-1 flex items-center justify-center relative z-10 shadow-sm">
            <img src={getImageUrl(item.image)} className="max-h-full max-w-full object-contain" alt="item" />
          </div>
        ))}
        {order.items_summary?.length > 3 && (
          <div className="w-10 h-10 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 relative z-0">
            +{order.items_summary.length - 3}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Paid</p>
           <p className="text-lg font-bold text-gray-900 mt-1">₹{order.total_amount.toLocaleString('en-IN')}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'Placed' && (
            <button onClick={() => onCancel(order.id)} className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors uppercase">Cancel</button>
          )}
          <Link to={`/my-orders/${order.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center uppercase tracking-wider">
            Details <ChevronRight className="ml-1 w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const MyOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { confirm, showToast } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    const isConfirmed = await confirm("Cancel Order?", "Are you sure you want to cancel this order?");
    if (!isConfirmed) return;

    const { error } = await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId).eq('status', 'Placed');
    if (error) {
      showToast('error', "Could not cancel order.");
    } else {
      showToast('success', "Order cancelled successfully.");
      fetchOrders();
    }
  };

  if (loading) return (
    <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen bg-white">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Check the status of your current and past shipments.</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No orders placed yet</h3>
          <p className="text-gray-500 text-sm mt-2">Start shopping from our extensive catalog today.</p>
          <Link to="/products" className="mt-8 inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider">Go Shopping</Link>
        </div>
      ) : (
        <div className="space-y-12">
          {orders.filter(o => ['Placed', 'Accepted', 'Shipped'].includes(o.status)).length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Active Shipments
              </h2>
              {orders.filter(o => ['Placed', 'Accepted', 'Shipped'].includes(o.status)).map(o => <OrderCard key={o.id} order={o} onCancel={handleCancelOrder} />)}
            </section>
          )}

          {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order History
              </h2>
              {orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status)).map(o => <OrderCard key={o.id} order={o} onCancel={handleCancelOrder} />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;