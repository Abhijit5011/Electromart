
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';

const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Feedback' | 'Complaint'>('All');
  const { showToast } = useNotification();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`*, profile:profiles(name, phone, email)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (e) {
      console.error("Feedback fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
    const { error } = await supabase.from('feedback').update({ status: newStatus }).eq('id', id);
    if (!error) {
      showToast('success', `Ticket marked as ${newStatus}`);
      fetchFeedback();
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => filter === 'All' || f.type === filter);

  if (loading) return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-500 text-sm mt-1">Review customer feedback and complaints.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['All', 'Feedback', 'Complaint'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              {f}s
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeedbacks.map((fb) => (
          <div key={fb.id} className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${fb.type === 'Feedback' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                {fb.type === 'Feedback' ? <MessageSquare className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {fb.type}
              </span>
              <button 
                onClick={() => handleUpdateStatus(fb.id, fb.status)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${fb.status === 'Resolved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
              >
                {fb.status === 'Resolved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {fb.status}
              </button>
            </div>

            <div className="flex-grow mb-8">
              <p className="text-gray-700 text-sm leading-relaxed italic">"{fb.message}"</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">{new Date(fb.created_at).toLocaleDateString()}</p>
            </div>

            <div className="pt-4 border-t border-gray-50 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded flex items-center justify-center font-bold text-xs uppercase">
                  {fb.profile?.name?.charAt(0) || 'U'}
                </div>
                <p className="text-sm font-bold text-gray-900">{fb.profile?.name || 'Guest User'}</p>
              </div>
              <div className="flex flex-col gap-1 text-[10px] text-gray-500 font-medium ml-11">
                <span className="flex items-center gap-2"><Phone className="w-3 h-3" /> {fb.profile?.phone || 'No phone'}</span>
                <span className="flex items-center gap-2"><Mail className="w-3 h-3" /> {fb.profile?.email || 'No email'}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredFeedbacks.length === 0 && (
          <div className="col-span-full py-24 text-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed text-sm">
            No support tickets found for this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
