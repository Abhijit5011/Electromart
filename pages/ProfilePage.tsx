
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Profile, Address, Feedback } from '../types/database';
import { User, Phone, MapPin, Plus, Trash2, MessageSquare, Edit2, Loader2, Clock, CheckCircle2, History, X } from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';

const ProfilePage: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useNotification();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<Feedback[]>([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'Feedback' | 'Complaint'>('Feedback');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    address_line: '',
    city: '',
    pincode: '',
    state: ''
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchUserFeedbacks();
    }
    if (profile) {
      setEditName(profile.name);
      setEditPhone(profile.phone);
    }
  }, [user, profile]);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id);
    if (data) setAddresses(data);
  };

  const fetchUserFeedbacks = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setUserFeedbacks(data);
    setLoadingHistory(false);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || !editPhone.trim()) return;
    setSubmittingProfile(true);
    try {
      await supabase
        .from('profiles')
        .update({ name: editName, phone: editPhone })
        .eq('id', user?.id);
      showToast('success', 'Profile updated');
      setIsEditingProfile(false);
      window.location.reload();
    } catch (err) {
      showToast('error', 'Update failed');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingAddress(true);
    try {
      await supabase.from('addresses').insert({
        user_id: user.id,
        ...newAddress,
        is_default: addresses.length === 0
      });
      showToast('success', 'Address saved');
      fetchAddresses();
      setShowAddressForm(false);
      setNewAddress({ name: '', phone: '', address_line: '', city: '', pincode: '', state: '' });
    } catch (err) {
      showToast('error', 'Failed to save address');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    showToast('info', 'Address deleted');
    fetchAddresses();
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !user) return;
    setSubmittingTicket(true);
    try {
      await supabase.from('feedback').insert({
        user_id: user.id,
        type: feedbackType,
        message: feedback,
        status: 'Pending'
      });
      showToast('success', 'Thank you for your feedback');
      setFeedback('');
      fetchUserFeedbacks();
    } catch (err) {
      showToast('error', 'Submission failed');
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {profile?.name.charAt(0)}
              </div>
              
              {isEditingProfile ? (
                <div className="w-full space-y-4">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full Name" className="w-full p-3 border rounded-lg text-sm" />
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="w-full p-3 border rounded-lg text-sm" />
                  <div className="flex gap-2">
                    <button onClick={handleUpdateProfile} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold uppercase">{submittingProfile ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setIsEditingProfile(false)} className="flex-1 border py-2 rounded-lg text-xs font-bold uppercase text-gray-500">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="text-center w-full">
                  <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
                  <p className="text-xs text-gray-500 mb-4">{user?.email}</p>
                  <div className="bg-white border rounded-lg py-2 px-4 mb-6 inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase">
                    <Phone className="w-3 h-3" /> {profile?.phone}
                  </div>
                  <button onClick={() => setIsEditingProfile(true)} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 border border-blue-100 hover:bg-blue-50 py-3 rounded-lg uppercase tracking-wider">
                    <Edit2 className="w-3 h-3" /> Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" /> Support
            </h3>
            <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
              <button onClick={() => setFeedbackType('Feedback')} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase ${feedbackType === 'Feedback' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>Feedback</button>
              <button onClick={() => setFeedbackType('Complaint')} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase ${feedbackType === 'Complaint' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}>Complaint</button>
            </div>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`Enter your ${feedbackType.toLowerCase()}...`}
              className="w-full h-32 p-4 bg-gray-50 border rounded-lg text-sm mb-4 outline-none focus:bg-white focus:border-blue-300 transition-all"
            />
            <button 
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim() || submittingTicket}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {submittingTicket ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Addresses & History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Saved Addresses
              </h3>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-blue-600 text-xs font-bold uppercase hover:underline flex items-center gap-1">
                {showAddressForm ? <><X className="w-3 h-3" /> Cancel</> : <><Plus className="w-3 h-3" /> Add New</>}
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 rounded-xl mb-8 space-y-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required placeholder="Full Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" />
                  <input required placeholder="Phone Number" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" />
                </div>
                <input required placeholder="Address Line" value={newAddress.address_line} onChange={e => setNewAddress({...newAddress, address_line: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" />
                  <input required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" />
                  <input required placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="w-full p-3 bg-white border rounded-lg text-sm" />
                </div>
                <button type="submit" disabled={submittingAddress} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider">{submittingAddress ? 'Saving...' : 'Save Address'}</button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-5 border border-gray-100 rounded-lg hover:border-blue-200 transition-all bg-white shadow-sm relative">
                  <p className="font-bold text-gray-900 mb-1">{addr.name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{addr.phone}</span>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {addr.is_default && <span className="absolute top-4 right-4 text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded uppercase font-bold">Default</span>}
                </div>
              ))}
              {addresses.length === 0 && !showAddressForm && (
                <div className="col-span-2 text-center py-10 text-gray-400 text-xs italic border-2 border-dashed rounded-lg">No addresses added yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-6">
              <History className="w-5 h-5 mr-2 text-blue-600" /> Support History
            </h3>
            
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-600" /></div>
              ) : userFeedbacks.length > 0 ? (
                userFeedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 border border-gray-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${fb.type === 'Feedback' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{fb.type}</span>
                        <span className="text-[9px] text-gray-400 font-medium">{new Date(fb.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2 italic">"{fb.message}"</p>
                    </div>
                    <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase border ${fb.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{fb.status}</div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-400 text-xs italic">No support history found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
