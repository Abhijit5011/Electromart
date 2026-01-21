
import React, { useState, useEffect } from 'react';
import { supabase, getImageUrl } from '../../lib/supabase';
import { Profile, Address, CartItem, Favorite } from '../../types/database';
import { useNotification } from '../../components/NotificationProvider';
import { 
  Search, 
  ShieldAlert, 
  Trash2, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  ExternalLink,
  X,
  UserX,
  ShieldCheck,
  Mail,
  Loader2,
  Phone
} from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const { confirm, showToast } = useNotification();
  const [userDetails, setUserDetails] = useState<{
    addresses: Address[],
    cart: CartItem[],
    favorites: Favorite[]
  }>({ addresses: [], cart: [], favorites: [] });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleToggleBan = async (user: Profile) => {
    const isConfirmed = await confirm(
      user.is_banned ? "Restore Access?" : "Deactivate Account?", 
      `Are you sure you want to ${user.is_banned ? 'restore' : 'deactivate'} access for ${user.name}?`
    );
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !user.is_banned })
      .eq('id', user.id);

    if (!error) {
      showToast('success', 'User status updated');
      fetchUsers();
    }
  };

  const handleDeleteUser = async (user: Profile) => {
    const isConfirmed = await confirm(
      "Confirm Deletion", 
      `This will permanently remove ${user.name} and all their data. Proceed?`
    );
    if (!isConfirmed) return;

    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (!error) {
      showToast('success', 'User removed');
      fetchUsers();
    } else {
      showToast('error', 'Delete failed. Check for active orders.');
    }
  };

  const fetchUserDetails = async (userId: string) => {
    const [addresses, cart, favorites] = await Promise.all([
      supabase.from('addresses').select('*').eq('user_id', userId),
      supabase.from('cart_items').select('*, product:products(*)').eq('user_id', userId),
      supabase.from('favorites').select('*, product:products(*)').eq('user_id', userId)
    ]);

    setUserDetails({
      addresses: addresses.data || [],
      cart: cart.data || [],
      favorites: favorites.data || []
    });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Directory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user accounts, roles, and access.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name/phone..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">User</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Contact</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center font-bold text-base">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3 h-3 text-gray-400" /> {user.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3 text-gray-400" /> {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_banned ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase tracking-widest">
                        Deactivated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-widest">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => { setSelectedUser(user); fetchUserDetails(user.id); }}
                        className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold uppercase hover:bg-gray-100 transition-colors"
                      >
                        Details
                      </button>
                      {user.role !== 'admin' && (
                        <>
                          <button 
                            onClick={() => handleToggleBan(user)}
                            className={`p-1.5 rounded-md transition-colors ${user.is_banned ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                            title={user.is_banned ? "Reactivate" : "Deactivate"}
                          >
                            {user.is_banned ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
            
            <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-6">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-lg flex items-center justify-center text-3xl font-bold">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">{selectedUser.email} • Joined {new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 border-r border-gray-50 pr-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" /> Saved Locations
                </h3>
                <div className="space-y-4">
                  {userDetails.addresses.length > 0 ? userDetails.addresses.map(addr => (
                    <div key={addr.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-1">{addr.name}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{addr.address_line}, {addr.city}, {addr.pincode}</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.address_line}, ${addr.city}, ${addr.pincode}`)}`}
                        target="_blank"
                        className="text-[10px] font-bold text-blue-600 flex items-center uppercase hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> View Map
                      </a>
                    </div>
                  )) : <p className="text-xs text-gray-400 italic">No addresses saved.</p>}
                </div>
              </div>

              <div className="md:col-span-2 space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" /> Active Shopping Cart
                  </h3>
                  <div className="space-y-2">
                    {userDetails.cart.length > 0 ? userDetails.cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                        <div className="flex items-center gap-3">
                           <img src={getImageUrl(item.product?.images[0] || '')} className="w-8 h-8 object-contain bg-gray-50 rounded border" />
                           <p className="text-xs font-semibold text-gray-700">{item.product?.name}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Qty: {item.quantity}</span>
                      </div>
                    )) : <p className="text-xs text-gray-400 italic">Cart is currently empty.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" /> Wishlist
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userDetails.favorites.length > 0 ? userDetails.favorites.map(fav => (
                      <div key={fav.id} className="flex items-center gap-3 p-3 bg-red-50/20 border border-red-50 rounded-lg">
                         <img src={getImageUrl(fav.product?.images[0] || '')} className="w-8 h-8 object-contain bg-white rounded border border-red-50" />
                         <p className="text-[10px] font-bold text-gray-600 line-clamp-1">{fav.product?.name}</p>
                      </div>
                    )) : <p className="text-xs text-gray-400 italic">No products in wishlist.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
