
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Profile } from './types/database';
import { NotificationProvider } from './components/NotificationProvider';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import FavoritesPage from './pages/FavoritesPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminReviews from './pages/admin/AdminReviews';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  signIn: () => {},
});

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Manual session check from localStorage
    const savedUser = localStorage.getItem('electromart_session');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      fetchProfile(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        localStorage.removeItem('electromart_session');
        throw error;
      }
      
      if (data.is_banned) {
        localStorage.removeItem('electromart_session');
        setProfile(null);
        alert("Your account has been deactivated. Please contact support.");
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = (userProfile: Profile) => {
    localStorage.setItem('electromart_session', JSON.stringify({ id: userProfile.id }));
    setProfile(userProfile);
  };

  const signOut = async () => {
    localStorage.removeItem('electromart_session');
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <AuthContext.Provider value={{ user: profile, profile, loading, signOut, signIn }}>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={!profile ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/signup" element={!profile ? <SignupPage /> : <Navigate to="/" />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                
                <Route path="/cart" element={profile ? <CartPage /> : <Navigate to="/login" />} />
                <Route path="/favorites" element={profile ? <FavoritesPage /> : <Navigate to="/login" />} />
                <Route path="/my-orders" element={profile ? <MyOrdersPage /> : <Navigate to="/login" />} />
                <Route path="/my-orders/:id" element={profile ? <OrderDetailsPage /> : <Navigate to="/login" />} />
                <Route path="/profile" element={profile ? <ProfilePage /> : <Navigate to="/login" />} />

                {profile?.role === 'admin' && (
                  <>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/feedback" element={<AdminFeedback />} />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                  </>
                )}
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthContext.Provider>
    </NotificationProvider>
  );
};

export default App;