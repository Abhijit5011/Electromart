
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Loader2 } from 'lucide-react';
import { Product } from '../types/database';
import { getImageUrl, supabase } from '../lib/supabase';
import { useAuth } from '../App';
import { useNotification } from '../components/NotificationProvider';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) checkFavorite();
  }, [user, product.id]);

  const checkFavorite = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      setIsFavorite(!!data);
    } catch (err) {
      console.error('Check favorite failed:', err);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('info', 'Please sign in to add items to cart');
      return navigate('/login');
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('cart_items').upsert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1
      }, { onConflict: 'user_id,product_id' });

      if (error) throw error;
      showToast('success', `${product.name} added to cart`);
    } catch (err: any) {
      console.error('Add to cart error:', err);
      showToast('error', 'Could not add to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('info', 'Please sign in to save favorites');
      return navigate('/login');
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (error) throw error;
        setIsFavorite(false);
        showToast('info', 'Removed from favorites');
      } else {
        const { error } = await supabase.from('favorites').insert({ 
          user_id: user.id, 
          product_id: product.id 
        });
        if (error) throw error;
        setIsFavorite(true);
        showToast('success', 'Added to favorites');
      }
    } catch (err: any) {
      console.error('Favorite toggle error:', err);
      showToast('error', 'Operation failed.');
    }
  };

  const discount = product.discount_price 
    ? Math.round(((product.price - product.discount_price) / product.price) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group h-full">
      <Link to={`/products/${product.id}`} className="relative block aspect-square bg-white overflow-hidden border-b border-gray-100">
        <img 
          src={getImageUrl(product.images[0])} 
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% OFF
          </div>
        )}
        <button 
          onClick={handleToggleFavorite}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm border transition-colors z-20 ${
            isFavorite ? 'bg-white text-red-500 border-gray-100' : 'bg-white text-gray-400 border-gray-100 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </Link>

      <div className="p-3 flex flex-col flex-grow">
        <div className="flex items-center space-x-1 mb-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-[11px] text-gray-500 font-medium">{product.rating}</span>
        </div>
        
        <Link to={`/products/${product.id}`} className="text-gray-900 font-medium text-sm line-clamp-2 hover:text-blue-600 mb-2 min-h-[2.5rem]">
          {product.name}
        </Link>

        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900">₹{(product.discount_price || product.price).toLocaleString('en-IN')}</span>
            {product.discount_price && (
              <span className="text-[10px] text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
            )}
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={loading}
            className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
