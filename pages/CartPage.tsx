
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, getImageUrl } from '../lib/supabase';
import { useAuth } from '../App';
import { CartItem, Address, OrderItemSummary } from '../types/database';
import { useNotification } from '../components/NotificationProvider';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  MapPin, 
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, confirm } = useNotification();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchAddresses();
    }
  }, [user]);

  const fetchCart = async () => {
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user?.id);
    if (data) setItems(data);
    setLoading(false);
  };

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user?.id);
    if (data) {
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', id);
    setItems(items.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const removeItem = async (id: string) => {
    const isConfirmed = await confirm("Remove Item?", "Do you want to remove this item from your cart?");
    if (!isConfirmed) return;
    await supabase.from('cart_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    showToast('info', 'Item removed');
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.product?.discount_price || item.product?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  const deliveryCharge = items.reduce((acc, item) => acc + (item.product?.delivery_charge || 0), 0);
  const total = subtotal + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('warning', "Please select a delivery address");
      return;
    }

    const isConfirmed = await confirm("Place Order?", `Total: ₹${total.toLocaleString('en-IN')}. Confirm order using Cash on Delivery?`);
    if (!isConfirmed) return;

    setPlacingOrder(true);
    const address = addresses.find(a => a.id === selectedAddressId);
    const itemsSummary: OrderItemSummary[] = items.map(item => ({
      product_id: item.product_id,
      name: item.product?.name || 'Product',
      price: item.product?.discount_price || item.product?.price || 0,
      quantity: item.quantity,
      image: item.product?.images[0] || ''
    }));

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: user?.id,
      total_amount: total,
      status: 'Placed',
      address: address,
      items_summary: itemsSummary
    }).select().single();

    if (orderError) {
      showToast('error', 'Failed to place order');
      setPlacingOrder(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.product?.discount_price || item.product?.price
    }));

    await supabase.from('order_items').insert(orderItems);
    await supabase.from('cart_items').delete().eq('user_id', user?.id);

    showToast('success', 'Order placed successfully!');
    navigate('/my-orders');
  };

  if (loading) return (
    <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
  );

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="bg-white p-12 rounded-xl border border-gray-200">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Start adding items to your cart to see them here.</p>
          <Link to="/products" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-block uppercase text-xs tracking-wider">
            Go to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-500 text-sm mt-1">{items.length} items in your bag</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="p-6 flex flex-col sm:flex-row items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="w-24 h-24 bg-white rounded-lg p-2 border border-gray-100 flex items-center justify-center shrink-0">
                  <img src={getImageUrl(item.product?.images[0] || '')} className="max-h-full max-w-full object-contain" alt={item.product?.name} />
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 flex-grow text-center sm:text-left">
                  <Link to={`/products/${item.product_id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                    {item.product?.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{item.product?.category}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden h-9">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-3 hover:bg-gray-100 text-gray-500 border-r transition-all"><Minus className="w-3 h-3" /></button>
                      <span className="px-4 font-bold text-sm text-gray-800">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-3 hover:bg-gray-100 text-gray-500 border-l transition-all"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-bold text-gray-900">₹{((item.product?.discount_price || item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="sm:ml-8 mt-4 sm:mt-0 p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Delivery Address
            </h2>
            
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <label key={addr.id} className={`flex flex-col p-5 rounded-lg border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50/20' : 'border-gray-50 hover:border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900 text-sm">{addr.name}</span>
                      <input type="radio" name="address" className="w-4 h-4 text-blue-600" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-[10px] font-bold text-gray-900 mt-auto uppercase tracking-wider">{addr.phone}</p>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm mb-4">No addresses found</p>
                <Link to="/profile" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-700 transition-all">Add Address</Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="font-bold text-gray-900">₹{deliveryCharge.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-gray-900 font-bold">Grand Total</span>
                <span className="text-2xl font-bold text-blue-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg mb-8 border border-gray-100 flex items-start gap-3">
               <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
               <div>
                 <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                 <p className="text-[10px] text-gray-500 font-medium">Pay when your order arrives</p>
               </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={!selectedAddressId || placingOrder}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {placingOrder ? 'Processing...' : <>Place Order <ArrowRight className="ml-2 w-4 h-4" /></>}
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Safe & Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
