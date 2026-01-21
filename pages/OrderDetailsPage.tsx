
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, getImageUrl } from '../lib/supabase';
import { Order, Profile, OrderItemSummary } from '../types/database';
import { ChevronLeft, Printer, Package, MapPin, Phone, Truck, CheckCircle2, Clock, XCircle, AlertCircle, ShoppingBag, Lock, Loader2 } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams();
  const { showToast } = useNotification();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("Order not found");

      setOrder(orderData);
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (order?.status !== 'Delivered') {
      showToast('warning', 'Invoice is available only after delivery.');
      return;
    }
    window.print();
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium text-sm">Syncing shipment data...</p>
    </div>
  );
  
  if (error || !order) return (
    <div className="py-20 text-center px-4">
      <div className="bg-white p-10 rounded-xl border border-gray-200 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-gray-500 mt-2 text-sm">The order ID might be incorrect or you may not have permission to view it.</p>
        <div className="mt-8">
          <Link to="/my-orders" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all inline-block">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );

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

  const addr = order.address as any;
  const items = (order.items_summary || []) as OrderItemSummary[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <div className="no-print">
        <Link to="/my-orders" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Orders
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Live Shipment Tracking</p>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
              <p className="text-xs text-gray-500 font-medium">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs border uppercase tracking-widest ${getStatusStyle(order.status)}`}>
              {order.status === 'Placed' && <Clock className="w-4 h-4" />}
              {order.status === 'Accepted' && <CheckCircle2 className="w-4 h-4" />}
              {order.status === 'Shipped' && <Truck className="w-4 h-4" />}
              {order.status === 'Delivered' && <CheckCircle2 className="w-4 h-4" />}
              {order.status === 'Cancelled' && <XCircle className="w-4 h-4" />}
              {order.status}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-10 border-b border-gray-100">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" /> Delivery To
              </h3>
              <p className="font-bold text-gray-900 text-lg mb-1">{addr.name}</p>
              <p className="text-sm text-gray-600">{addr.address_line}</p>
              <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
              <div className="mt-4 flex items-center text-sm font-bold text-gray-900">
                <Phone className="w-4 h-4 mr-2 text-gray-400" /> {addr.phone}
              </div>
            </div>
            <div className="bg-blue-50/30 p-6 rounded-xl border border-blue-50">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" /> Order Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Mode</span>
                  <span className="font-bold text-gray-900">Cash on Delivery</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping Mode</span>
                  <span className="font-bold text-gray-900">Standard Delivery</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-blue-100/50">
                  <span className="text-gray-500 font-bold">Total Amount</span>
                  <span className="font-bold text-blue-600">₹{order.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 mr-2 text-blue-600" /> Product Inventory
            </h3>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                  <div className="w-16 h-16 bg-white rounded-lg p-2 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                    <img src={getImageUrl(item.image)} className="max-h-full max-w-full object-contain" alt={item.name} />
                  </div>
                  <div className="ml-5 flex-grow">
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')}/pc</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-gray-100">
            <div className="text-center sm:text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Total Postpaid Amount</span>
              <span className="text-3xl font-bold text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              {order.status === 'Delivered' ? (
                 <button 
                   onClick={handlePrint}
                   className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center"
                 >
                   <Printer className="w-4 h-4 mr-2" /> Download Invoice
                 </button>
              ) : (
                <div className="flex-1 bg-gray-50 border border-gray-200 px-6 py-3 rounded-lg flex items-center justify-center gap-3 opacity-60">
                   <Lock className="w-4 h-4 text-gray-400" />
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoice Available Post Delivery</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY INVOICE */}
      {order.status === 'Delivered' && (
        <div className="print-only p-12 bg-white text-gray-900">
          <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ELECTROMART</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Sponsored by KT Electricals</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-widest mb-2">TAX INVOICE</h2>
              <p className="text-xs"><b>Invoice ID:</b> {order.id.toUpperCase()}</p>
              <p className="text-xs"><b>Date:</b> {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
             <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h4>
                <p className="font-bold text-sm">{addr.name}</p>
                <p className="text-xs text-gray-600 mt-1">{addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}</p>
                <p className="text-xs font-bold text-gray-900 mt-2">{addr.phone}</p>
             </div>
             <div className="text-right">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vendor Details</h4>
                <p className="font-bold text-sm">KT Electricals Pvt Ltd</p>
                <p className="text-xs text-gray-600 mt-1">Industrial Estate, Mumbai - 400001</p>
                <p className="text-xs font-bold text-gray-900 mt-2">GSTIN: 27AAAAA0000A1Z5</p>
             </div>
          </div>

          <table className="w-full text-left border-collapse mb-10">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest">Product Description</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-center">Qty</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Unit Price</th>
                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 px-4 text-xs font-bold">{item.name}</td>
                  <td className="py-4 px-4 text-xs text-center">{item.quantity}</td>
                  <td className="py-4 px-4 text-xs text-right">₹{item.price.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-4 text-xs text-right font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}

              <tr>
                <td colSpan={3} className="py-4 px-4 text-xs font-bold">
                  Delivery Charges
                </td>
                <td className="py-4 px-4 text-xs text-right font-bold">
                  ₹{Math.max(order.total_amount - items.reduce((sum, item) => sum + item.price * item.quantity,0),0).toLocaleString('en-IN')}
                </td>
              </tr>

            </tbody>
          </table>

          <div className="flex justify-end pt-6 border-t border-gray-900">
             <div className="text-right space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Net Total with Delivery</p>
                <p className="text-3xl font-bold text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
             </div>
          </div>

          <div className="mt-20 pt-10 border-t border-gray-100 text-[9px] text-gray-400 text-center uppercase tracking-[0.2em]">
             This is a computer generated document. No signature required.
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
