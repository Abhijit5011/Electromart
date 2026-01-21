
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex flex-col items-start">
              <span className="text-2xl font-bold text-blue-600 tracking-tight leading-none">Electromart</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sponsored by KT Electricals</span>
            </Link>
            <p className="mt-4 text-gray-500 max-w-sm">
              Your one-stop shop for premium electronics and electrical equipment. Serving quality with trust since years.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li><Link to="/products" className="hover:text-blue-600">All Products</Link></li>
              <li><Link to="/products?category=Electrical" className="hover:text-blue-600">Electricals</Link></li>
              <li><Link to="/products?category=Electronics" className="hover:text-blue-600">Electronics</Link></li>
              <li><Link to="/products?category=Lighting" className="hover:text-blue-600">Lighting</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li><Link to="/profile" className="hover:text-blue-600">Help Center</Link></li>
              <li><Link to="/profile" className="hover:text-blue-600">Feedback</Link></li>
              <li><Link to="/profile" className="hover:text-blue-600">Complaints</Link></li>
              <li><span className="text-gray-400">Toll Free: 1800-ELE-MART</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-50 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Electromart. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
