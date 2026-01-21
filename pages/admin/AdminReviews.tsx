
import React, { useState, useEffect } from 'react';
import { supabase, getImageUrl } from '../../lib/supabase';
import { Star, Trash2, Search, Loader2 } from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, showToast } = useNotification();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, product:products(name, images), profile:profiles(name, phone)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data || []);
    } catch (e) {
      console.error("Admin reviews fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (review: any) => {
    const isConfirmed = await confirm("Delete Review?", `Are you sure you want to remove this review from ${review.profile?.name}?`);
    if (!isConfirmed) return;

    const { error } = await supabase.from('reviews').delete().eq('id', review.id);
    if (!error) {
      showToast('success', 'Review removed');
      fetchReviews();
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
          <p className="text-gray-500 text-sm mt-1">Audit and moderate product reviews and ratings.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search reviews..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((r) => (
          <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col md:flex-row gap-8 hover:border-blue-200 transition-colors shadow-sm">
            <div className="md:w-1/4">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded flex items-center justify-center font-bold text-sm">
                     {r.profile?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                     <p className="font-bold text-gray-900 text-sm">{r.profile?.name || 'Customer'}</p>
                     <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="ml-2 text-xs font-bold text-gray-900">{r.rating}/5</span>
               </div>
            </div>

            <div className="flex-grow">
               <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded p-1 shrink-0">
                     <img src={getImageUrl(r.product?.images?.[0] || '')} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{r.product?.name || 'Deleted Product'}</p>
               </div>
               <p className="text-gray-600 text-sm leading-relaxed italic">"{r.comment}"</p>
            </div>

            <div className="md:w-32 flex justify-end items-start pt-2">
               <button 
                 onClick={() => handleDeleteReview(r)}
                 className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                 title="Delete Review"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="py-24 text-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed text-sm">
             No matching review records found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
