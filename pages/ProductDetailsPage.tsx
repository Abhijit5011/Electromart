
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, getImageUrl } from '../lib/supabase';
import { Product, Review } from '../types/database';
import { useAuth } from '../App';
import ProductCard from '../components/ProductCard';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Truck, 
  ChevronRight,
  Info,
  MessageSquare,
  CheckCircle,
  Loader2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useNotification } from '../components/NotificationProvider';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
    fetchReviews();
    if (user) checkFavorite();
  }, [id, user]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      navigate('/products');
      return;
    }
    setProduct(data);
    fetchRelatedProducts(data.category, data.id);
    if (user) checkPurchaseStatus(data.id);
    setLoading(false);
  };

  const checkFavorite = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      setIsFavorite(!!data);
    } catch (err) {
      console.error('Check favorite error:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          profile:profiles(name)
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data || []);
    } catch (e) {
      console.error("Reviews load error", e);
    }
  };

  const fetchRelatedProducts = async (category: string, currentId: string) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .neq('id', currentId)
      .limit(5);
    if (data) setRelatedProducts(data);
  };

  const checkPurchaseStatus = async (productId: string) => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('items_summary, status')
        .eq('user_id', user?.id)
        .eq('status', 'Delivered');
      
      const hasBought = data?.some(order => 
        (order.items_summary as any[]).some(item => item.product_id === productId)
      );
      setCanReview(!!hasBought);
    } catch (e) {
      setCanReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      showToast('info', 'Please sign in to add items to cart');
      return navigate('/login');
    }
    
    setCartLoading(true);
    try {
      const { error } = await supabase.from('cart_items').upsert({
        user_id: user.id,
        product_id: id,
        quantity: 1
      }, { onConflict: 'user_id,product_id' });

      if (error) throw error;
      
      setIsAdded(true);
      showToast('success', 'Added to cart');
      setTimeout(() => setIsAdded(false), 3000);
      return true;
    } catch (err: any) {
      console.error('Add to cart error:', err);
      showToast('error', 'Could not add to cart.');
      return false;
    } finally {
      setCartLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('info', 'Please sign in to save items');
      return navigate('/login');
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        if (error) throw error;
        setIsFavorite(false);
        showToast('info', 'Removed from wishlist');
      } else {
        const { error } = await supabase.from('favorites').insert({ 
          user_id: user.id, 
          product_id: id 
        });
        if (error) throw error;
        setIsFavorite(true);
        showToast('success', 'Saved to wishlist');
      }
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    const success = await handleAddToCart();
    if (success) navigate('/cart');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user?.id,
        product_id: id,
        rating: newRating,
        comment: newComment
      });

      if (error) throw error;

      setNewComment('');
      setNewRating(5);
      fetchReviews();
      showToast('success', 'Review posted');
    } catch (err) {
      showToast('error', 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const avgRatingValue = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-500 mb-8 border-b border-gray-100 pb-4">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3 h-3 mx-2" />
        <Link to="/products" className="hover:text-blue-600">Products</Link>
        <ChevronRight className="w-3 h-3 mx-2" />
        <span className="text-gray-900 truncate font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center relative overflow-hidden">
            <img 
              src={getImageUrl(product.images[activeImage])} 
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 rounded-md border p-1 transition-all shrink-0 ${activeImage === idx ? 'border-blue-600' : 'border-gray-200 opacity-60'}`}
              >
                <img src={getImageUrl(img)} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{product.category}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${product.stock_quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-gray-900">{avgRatingValue}</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">({reviews.length} Customer Reviews)</span>
          </div>

          <div className="border-t border-b border-gray-100 py-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900">₹{(product.discount_price || product.price).toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <span className="text-lg text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">Includes all taxes</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-2 text-xs text-gray-600">
               <Truck className="w-4 h-4 text-gray-400" />
               <span>Delivery: ₹{product.delivery_charge || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
               <Calendar className="w-4 h-4 text-gray-400" />
               <span>Est. time: {product.delivery_days || '3-5'} days</span>
            </div>
          </div>

          <div className="space-y-3 mb-10">
            <button 
              onClick={handleBuyNow}
              disabled={product.stock_quantity === 0 || cartLoading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Buy Now
            </button>
            <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || isAdded || cartLoading}
                className={`py-3 rounded-lg font-bold border transition-colors flex items-center justify-center text-sm ${
                  isAdded ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900'
                }`}
              >
                {cartLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isAdded ? (
                  <><CheckCircle className="w-4 h-4 mr-2" /> In Cart</>
                ) : (
                  <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart</>
                )}
              </button>
              <button 
                onClick={handleToggleFavorite}
                className={`py-3 rounded-lg font-bold border transition-colors flex items-center justify-center text-sm ${
                  isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
             <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wider text-xs">
                   Specifications
                </h3>
                <div className="grid grid-cols-1 gap-2 border rounded-lg p-4 bg-gray-50">
                  {Object.entries(product.specs || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1.5 border-b border-gray-200 last:border-0 text-sm">
                      <span className="text-gray-500 font-medium">{key}</span>
                      <span className="text-gray-900 font-semibold">{val}</span>
                    </div>
                  ))}
                  {Object.keys(product.specs || {}).length === 0 && <p className="text-xs text-gray-400">Not provided</p>}
                </div>
             </div>
             
             <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider text-xs">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
             </div>
          </div>
        </div>
      </div>

      <section className="mt-20 border-t border-gray-100 pt-12">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
        </div>

        {canReview && (
          <div className="bg-gray-50 rounded-xl p-8 mb-12 border border-gray-200">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Leave a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setNewRating(s)}>
                    <Star className={`w-6 h-6 ${s <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full h-24 p-4 border border-gray-300 rounded-lg outline-none text-sm focus:border-blue-500"
                required
              />
              <button type="submit" disabled={submittingReview} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm">
                {submittingReview ? 'Posting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {r.profile?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{r.profile?.name || 'Customer'}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">"{r.comment}"</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
               No reviews for this product yet.
            </div>
          )}
        </div>

        <div className="mt-20">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
              <Link to={`/products?category=${product.category}`} className="text-blue-600 font-semibold text-xs flex items-center hover:underline">
                View Category <ArrowRight className="ml-1 w-3 h-3" />
              </Link>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {relatedProducts.map(rp => (
                <ProductCard key={rp.id} product={rp} />
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailsPage;
