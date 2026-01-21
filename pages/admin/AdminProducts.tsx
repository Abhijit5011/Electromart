
import React, { useState, useEffect } from 'react';
import { supabase, getImageUrl } from '../../lib/supabase';
import { Product } from '../../types/database';
import { useNotification } from '../../components/NotificationProvider';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Upload, 
  X,
  Save,
  Tag,
  Truck,
  Calendar
} from 'lucide-react';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirm, showToast } = useNotification();
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Electrical',
    stock_quantity: 0,
    images: [],
    specs: {},
    rating: 4.5,
    delivery_charge: 0,
    delivery_days: 3
  });
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!currentProduct.name || currentProduct.images?.length === 0) {
      showToast('warning', "Name and images are mandatory.");
      return;
    }

    const { error } = await supabase.from('products').upsert(currentProduct);
    if (!error) {
      showToast('success', "Product saved successfully!");
      setShowModal(false);
      fetchProducts();
    } else {
      showToast('error', "Failed to save product.");
    }
  };

  const handleDelete = async (p: Product) => {
    const isConfirmed = await confirm("Delete Product?", `Are you sure you want to delete ${p.name}?`);
    if (!isConfirmed) return;

    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (!error) {
       showToast('success', 'Product deleted');
       fetchProducts();
    } else {
       showToast('error', 'Could not delete product.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files) as File[]) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data } = await supabase.storage.from('products').upload(fileName, file);
      
      if (data) {
        setCurrentProduct(prev => ({
          ...prev,
          images: [...(prev.images || []), data.path]
        }));
      }
    }
  };

  const addSpec = () => {
    if (!specKey || !specVal) return;
    setCurrentProduct(prev => ({
      ...prev,
      specs: { ...(prev.specs || {}), [specKey]: specVal }
    }));
    setSpecKey('');
    setSpecVal('');
  };

  const removeImage = (idx: number) => {
    setCurrentProduct(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== idx)
    }));
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage products, stock levels, and technical specs.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 text-sm outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
          <button 
            onClick={() => {
              setCurrentProduct({ name: '', description: '', price: 0, category: 'Electrical', stock_quantity: 0, images: [], specs: {}, rating: 4.5, delivery_charge: 0, delivery_days: 3 });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shrink-0 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Product</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Price & Stock</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Logistics</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img src={getImageUrl(p.images[0])} className="w-12 h-12 rounded-md bg-white border p-1 object-contain" />
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">{p.name}</p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 inline-block">{p.category}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <p className="font-bold text-gray-900 text-base">₹{p.price.toLocaleString('en-IN')}</p>
                   <p className={`text-[10px] font-bold mt-1 ${p.stock_quantity < 5 ? 'text-red-500' : 'text-gray-400'}`}>
                    {p.stock_quantity} units left
                   </p>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-500">
                      <div className="flex items-center gap-2">
                         <Truck className="w-3 h-3 text-gray-400" /> ₹{p.delivery_charge || 0}
                      </div>
                      <div className="flex items-center gap-2">
                         <Calendar className="w-3 h-3 text-gray-400" /> {p.delivery_days || 3} days
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setCurrentProduct(p); setShowModal(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
            
            <div className="mb-8 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">{currentProduct.id ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-xs text-gray-500 mt-1">Fill in the product details below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Display Name</label>
                  <input value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. Copper Wire 1.5mm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Category</label>
                    <select value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                      <option>Electrical</option>
                      <option>Electronics</option>
                      <option>Lighting</option>
                      <option>Appliances</option>
                      <option>Wires & Cables</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Stock Units</label>
                    <input type="number" value={currentProduct.stock_quantity} onChange={e => setCurrentProduct({...currentProduct, stock_quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Base Price (₹)</label>
                    <input type="number" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Sale Price (₹)</label>
                    <input type="number" value={currentProduct.discount_price || 0} onChange={e => setCurrentProduct({...currentProduct, discount_price: parseFloat(e.target.value) || undefined})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Deliv. Charge (₹)</label>
                    <input type="number" value={currentProduct.delivery_charge || 0} onChange={e => setCurrentProduct({...currentProduct, delivery_charge: parseFloat(e.target.value)})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Est. Delivery (Days)</label>
                    <input type="number" value={currentProduct.delivery_days || 3} onChange={e => setCurrentProduct({...currentProduct, delivery_days: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Product Gallery</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {currentProduct.images?.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-gray-50 rounded-lg border border-gray-200 relative p-2">
                        <img src={getImageUrl(img)} className="w-full h-full object-contain" />
                        <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 text-red-500 rounded-full shadow-sm"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {(currentProduct.images?.length || 0) < 3 && (
                      <label className="aspect-square bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Upload</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Description</label>
                  <textarea value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm focus:bg-white focus:ring-1 focus:ring-blue-500" placeholder="Product details..." />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Specifications</label>
                  <div className="flex gap-2 mb-3">
                    <input placeholder="Key" value={specKey} onChange={e => setSpecKey(e.target.value)} className="w-1/3 px-3 py-2 bg-gray-50 border rounded-lg text-xs" />
                    <input placeholder="Value" value={specVal} onChange={e => setSpecVal(e.target.value)} className="w-1/2 px-3 py-2 bg-gray-50 border rounded-lg text-xs" />
                    <button onClick={addSpec} className="px-3 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase">Add</button>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(currentProduct.specs || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded text-xs border border-gray-100">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">{k}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-700">{v}</span>
                          <button onClick={() => {
                            const newSpecs = { ...currentProduct.specs };
                            delete newSpecs[k];
                            setCurrentProduct({ ...currentProduct, specs: newSpecs });
                          }} className="text-gray-400 hover:text-red-500">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-xs font-bold text-gray-500 uppercase hover:bg-gray-50 rounded-lg">Discard</button>
              <button 
                onClick={handleSaveProduct}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
