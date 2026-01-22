
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, RotateCcw, Laptop, Lightbulb, Power, Cable, Smartphone } from 'lucide-react';
import { Product } from '../types/database';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .limit(8);
      
      if (products) setFeaturedProducts(products);
      setLoading(false);
    };

    loadHomeData();
  }, []);

  const categories = [
    { name: 'Electrical', icon: <Power className="w-5 h-5" /> },
    { name: 'Electronics', icon: <Smartphone className="w-5 h-5" /> },
    { name: 'Lighting', icon: <Lightbulb className="w-5 h-5" /> },
    { name: 'Wires & Cables', icon: <Cable className="w-5 h-5" /> },
    { name: 'Appliances', icon: <Laptop className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              K T <span className="text-blue-600">Electricals</span> - Your One-Stop Shop for Electrical & Electronics Goods
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Find everything from professional electrical components to the latest gadgets. Quality guaranteed by KT Electricals.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Link 
                to="/products" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              >
                Shop Now <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1000" 
              className="rounded-xl shadow-md border border-gray-200 object-cover w-full h-[300px] md:h-[400px]" 
              alt="Electrical Goods" 
            />
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="border-b border-gray-100 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Fast Delivery', icon: <Zap className="w-5 h-5" /> },
            { label: 'Quality Assured', icon: <Shield className="w-5 h-5" /> },
            { label: 'Easy Returns', icon: <RotateCcw className="w-5 h-5" /> },
            { label: 'Expert Support', icon: <ArrowRight className="w-5 h-5" /> },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 justify-center md:justify-start">
              <div className="text-blue-600">{item.icon}</div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto mt-2"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link 
                key={cat.name} 
                to={`/products?category=${cat.name}`}
                className="p-8 rounded-xl border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all flex flex-col items-center text-center bg-white"
              >
                <div className="text-blue-600 mb-4 bg-blue-50 p-4 rounded-full">{cat.icon}</div>
                <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked for your needs</p>
            </div>
            <Link to="/products" className="text-blue-600 text-sm font-semibold hover:underline flex items-center">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-72 animate-pulse border border-gray-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
