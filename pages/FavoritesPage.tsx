
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { Favorite } from '../types/database';
import ProductCard from '../components/ProductCard';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('*, product:products(*)')
      .eq('user_id', user?.id);
    if (data) setFavorites(data);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wishlist</h1>
          <p className="text-gray-500 text-sm mt-1">Products you have saved for later.</p>
        </div>
        <Link to="/products" className="text-blue-600 text-sm font-bold flex items-center hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Continue Shopping
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg h-72 animate-pulse" />
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {favorites.map((fav) => fav.product && (
            <ProductCard key={fav.id} product={fav.product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 max-w-lg mx-auto">
           <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-gray-900">Wishlist is empty</h3>
           <p className="text-gray-500 text-sm mt-2">Save items you like to find them easily here.</p>
           <Link to="/products" className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-sm inline-block uppercase tracking-wider">
             Explore Products
           </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
