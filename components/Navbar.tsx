
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { 
  ShoppingBag, 
  Heart, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Package
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchCartCount();
      const channel = supabase
        .channel(`cart-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'cart_items', 
          filter: `user_id=eq.${user.id}` 
        }, () => {
          fetchCartCount();
        })
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    } else {
      setCartCount(0);
    }
  }, [user]);

  const fetchCartCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setCartCount(count || 0);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    ...(user ? [{ name: 'My Orders', path: '/my-orders' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-md">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-none">Electromart</span>
                <span className="text-[10px] text-gray-500 font-medium">KT Electricals</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="flex items-center space-x-4 border-l pl-6 border-gray-200">
              {user ? (
                <>
                  <Link to="/favorites" className={`hover:text-red-500 transition-colors ${isActive('/favorites') ? 'text-red-500' : 'text-gray-500'}`} title="Wishlist">
                    <Heart className="w-5 h-5" />
                  </Link>
                  <Link to="/cart" className={`relative hover:text-blue-600 transition-colors ${isActive('/cart') ? 'text-blue-600' : 'text-gray-500'}`} title="Cart">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className={`hover:text-gray-900 transition-colors ${isActive('/profile') ? 'text-gray-900' : 'text-gray-500'}`} title="Profile">
                    <User className="w-5 h-5" />
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-bold hover:bg-gray-200 transition-all">
                      ADMIN
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">Login</Link>
                  <Link 
                    to="/signup" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-500">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} className={`block px-4 py-3 rounded-lg text-sm font-medium ${isActive(link.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`} onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" className="block px-4 py-3 text-sm font-medium text-gray-600" onClick={() => setIsOpen(false)}>Profile</Link>
                <Link to="/cart" className="block px-4 py-3 text-sm font-medium text-gray-600" onClick={() => setIsOpen(false)}>Cart ({cartCount})</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600">Logout</button>
              </>
            ) : (
              <div className="pt-2 flex flex-col space-y-2 px-4 pb-4">
                <Link to="/login" className="block text-center py-2 text-sm font-medium text-gray-600 border rounded-lg" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/signup" className="block text-center py-2 text-sm font-medium bg-blue-600 text-white rounded-lg" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
