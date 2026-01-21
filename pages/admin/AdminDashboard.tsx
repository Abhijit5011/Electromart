
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  Clock, 
  Package,
  Star,
  MessageSquare,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    pendingOrders: 0,
    activeProducts: 0,
    avgRating: 0,
    totalFeedback: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [orders, users, products, reviews, feedback] = await Promise.all([
      supabase.from('orders').select('total_amount, status'),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('reviews').select('rating'),
      supabase.from('feedback').select('id', { count: 'exact' })
    ]);

    const sales = orders.data?.filter(o => o.status !== 'Cancelled').reduce((acc, curr) => acc + curr.total_amount, 0) || 0;
    const pending = orders.data?.filter(o => ['Placed', 'Accepted', 'Shipped'].includes(o.status)).length || 0;
    const ratings = reviews.data?.map(r => r.rating) || [];
    const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

    setStats({
      totalSales: sales,
      totalOrders: orders.data?.length || 0,
      totalUsers: users.count || 0,
      pendingOrders: pending,
      activeProducts: products.count || 0,
      avgRating: Number(avg.toFixed(1)),
      totalFeedback: feedback.count || 0
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalSales.toLocaleString()}`, icon: <IndianRupee />, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: <Clock />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Customers', value: stats.totalUsers, icon: <Users />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const menuItems = [
    { label: 'Manage Inventory', path: '/admin/products', icon: <Package />, count: stats.activeProducts, desc: 'Add or edit product listings' },
    { label: 'Order Management', path: '/admin/orders', icon: <ShoppingBag />, count: stats.totalOrders, desc: 'Track shipments and statuses' },
    { label: 'Customer Management', path: '/admin/users', icon: <Users />, count: stats.totalUsers, desc: 'View user profiles and access' },
    { label: 'Feedback & Complaints', path: '/admin/feedback', icon: <MessageSquare />, count: stats.totalFeedback, desc: 'Respond to feedback/complaints' },
    { label: 'Product Reviews', path: '/admin/reviews', icon: <Star />, count: stats.avgRating, desc: 'Moderate customer ratings' },
  ];

  if (loading) return <div className="p-12 text-center text-gray-500 text-sm">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm">Overview of business performance and quick actions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-2 rounded-md ${s.bg} ${s.color}`}>
                {React.cloneElement(s.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blue-600 rounded-lg p-8 text-white">
            <h2 className="text-xl font-bold mb-2">Inventory Sync Status</h2>
            <p className="text-blue-100 text-sm mb-6 max-w-md">There are {stats.pendingOrders} orders currently awaiting processing. Please check the order log to update their shipment status.</p>
            <Link to="/admin/orders" className="bg-white text-blue-600 px-6 py-2 rounded-md font-bold text-xs inline-flex items-center hover:bg-blue-50 transition-colors uppercase">
              Manage Orders <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Management Links</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <Link key={item.label} to={item.path} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                  <div className="bg-gray-100 p-2.5 rounded-md text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Key Insights
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Avg. Rating</span>
                <span className="font-bold text-gray-900">{stats.avgRating}/5</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Support Load</span>
                <span className="font-bold text-gray-900">{stats.totalFeedback} tickets</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Products in Stock</span>
                <span className="font-bold text-gray-900">{stats.activeProducts}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-6 text-white">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">System Info</p>
            <p className="text-sm text-slate-200">Electromart Management Studio</p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
               <span>Version 1.2.0</span>
               <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
