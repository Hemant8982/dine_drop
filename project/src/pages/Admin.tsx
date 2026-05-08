import { useEffect, useState } from 'react';
import { UtensilsCrossed, Package, BarChart3, Plus, Pencil, Trash2, X, Truck, Hash, FolderOpen } from 'lucide-react';
import api from '../lib/api';
import type { Category, MenuItem, Order } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

type Tab = 'categories' | 'menu' | 'orders' | 'stats';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', imageUrl: '' });

  // Menu item form
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', categoryId: '', imageUrl: '', isAvailable: true, isPopular: false });

  useEffect(() => {
    loadCategories();
    loadMenuItems();
  }, []);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'stats') loadStats();
  }, [tab]);

  const loadCategories = async () => {
    const { data } = await api.get('/categories');
    setCategories(data.data || []);
  };

  const loadMenuItems = async () => {
    const { data } = await api.get('/menu');
    setMenuItems(data.data || []);
  };

  const loadOrders = async () => {
    const { data } = await api.get('/admin/orders');
    setOrders(data.data || []);
  };

  const loadStats = async () => {
    const { data } = await api.get('/admin/stats');
    setStats(data.data);
  };

  // --- Category handlers ---
  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: catForm.name,
        description: catForm.description,
        imageUrl: catForm.imageUrl,
      };
      if (editingCat) {
        await api.put(`/admin/categories/${editingCat.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created');
      }
      setShowCatForm(false);
      setEditingCat(null);
      resetCatForm();
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleCatDelete = async (id: number) => {
    if (!confirm('Delete this category? Menu items in this category will also be affected.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      loadCategories();
      loadMenuItems();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', imageUrl: cat.image_url || '' });
    setShowCatForm(true);
  };

  const resetCatForm = () => {
    setCatForm({ name: '', description: '', imageUrl: '' });
  };

  // --- Menu item handlers ---
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price),
        categoryId: parseInt(menuForm.categoryId),
        imageUrl: menuForm.imageUrl,
        isAvailable: menuForm.isAvailable,
        isPopular: menuForm.isPopular,
      };

      if (editingItem) {
        await api.put(`/admin/menu/${editingItem.id}`, payload);
        toast.success('Menu item updated');
      } else {
        await api.post('/admin/menu', payload);
        toast.success('Menu item created');
      }
      setShowMenuForm(false);
      setEditingItem(null);
      resetMenuForm();
      loadMenuItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/admin/menu/${id}`);
      toast.success('Menu item deleted');
      loadMenuItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success('Status updated');
      loadOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const resetMenuForm = () => {
    setMenuForm({ name: '', description: '', price: '', categoryId: '', imageUrl: '', isAvailable: true, isPopular: false });
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.category_id.toString(),
      imageUrl: item.image_url || '',
      isAvailable: item.is_available,
      isPopular: item.is_popular,
    });
    setShowMenuForm(true);
  };

  const nextStatus: Record<string, string> = {
    PENDING: 'PREPARING',
    PREPARING: 'OUT_FOR_DELIVERY',
    OUT_FOR_DELIVERY: 'DELIVERED',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {([
            { key: 'categories' as Tab, label: 'Categories', icon: FolderOpen },
            { key: 'menu' as Tab, label: 'Menu Items', icon: UtensilsCrossed },
            { key: 'orders' as Tab, label: 'Orders', icon: Package },
            { key: 'stats' as Tab, label: 'Statistics', icon: BarChart3 },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* ===== CATEGORIES TAB ===== */}
        {tab === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500">{categories.length} categories</p>
              <button
                onClick={() => { resetCatForm(); setEditingCat(null); setShowCatForm(true); }}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Add Category
              </button>
            </div>

            {/* Category Form Modal */}
            {showCatForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{editingCat ? 'Edit Category' : 'Add Category'}</h2>
                    <button onClick={() => { setShowCatForm(false); setEditingCat(null); }} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleCatSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input type="text" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" rows={2} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input type="url" value={catForm.imageUrl} onChange={e => setCatForm(p => ({ ...p, imageUrl: e.target.value }))}
                        placeholder="https://images.pexels.com/..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors">
                      {editingCat ? 'Update Category' : 'Create Category'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => {
                const itemCount = menuItems.filter(m => m.category_id === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                            <FolderOpen size={20} className="text-orange-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                          <p className="text-xs text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditCat(cat)} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleCatDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== MENU ITEMS TAB ===== */}
        {tab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500">{menuItems.length} menu items</p>
              <button
                onClick={() => { resetMenuForm(); setEditingItem(null); setShowMenuForm(true); }}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            {/* Menu Form Modal */}
            {showMenuForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
                    <button onClick={() => { setShowMenuForm(false); setEditingItem(null); }} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleMenuSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input type="text" value={menuForm.name} onChange={e => setMenuForm(p => ({ ...p, name: e.target.value }))} required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={menuForm.description} onChange={e => setMenuForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <input type="number" step="0.01" value={menuForm.price} onChange={e => setMenuForm(p => ({ ...p, price: e.target.value }))} required
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select value={menuForm.categoryId} onChange={e => setMenuForm(p => ({ ...p, categoryId: e.target.value }))} required
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                          <option value="">Select</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input type="url" value={menuForm.imageUrl} onChange={e => setMenuForm(p => ({ ...p, imageUrl: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={menuForm.isAvailable} onChange={e => setMenuForm(p => ({ ...p, isAvailable: e.target.checked }))} className="rounded" />
                        Available
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={menuForm.isPopular} onChange={e => setMenuForm(p => ({ ...p, isPopular: e.target.checked }))} className="rounded" />
                        Popular
                      </label>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors">
                      {editingItem ? 'Update Item' : 'Create Item'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Menu Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {menuItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={item.image_url || ''} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium text-sm text-gray-900">{item.name}</p>
                              {item.is_popular && <span className="text-xs text-orange-500">Popular</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.category?.name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${Number(item.price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== ORDERS TAB ===== */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No orders yet</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">Order #{order.id}</span>
                      <StatusBadge status={order.status} />
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.order_type === 'DINE_IN'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {order.order_type === 'DINE_IN' ? <UtensilsCrossed size={10} /> : <Truck size={10} />}
                        {order.order_type === 'DINE_IN' ? 'Dine In' : 'Delivery'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">{new Date(order.order_date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-500">
                      {order.user?.name} &middot; {order.user?.email}
                      {order.order_type === 'DINE_IN' && order.table_number && (
                        <span className="ml-2 inline-flex items-center gap-1 text-blue-600">
                          <Hash size={10} /> Table {order.table_number}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-orange-600">${Number(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {order.order_items?.map(oi => `${oi.menu_item?.name} x${oi.quantity}`).join(', ')}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && nextStatus[order.status] && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, nextStatus[order.status])}
                        className="text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Mark as {nextStatus[order.status].replace(/_/g, ' ')}
                      </button>
                    )}
                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                        className="text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== STATS TAB ===== */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${Number(stats.totalRevenue).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Orders Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrdersToday}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Top Items</p>
              <p className="text-3xl font-bold text-gray-900">{stats.mostOrdered?.length || 0}</p>
            </div>
          </div>
        )}

        {tab === 'stats' && stats?.mostOrdered?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Ordered Items</h3>
            <div className="space-y-3">
              {stats.mostOrdered.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="font-medium text-gray-900 text-sm">{item.item?.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.totalQty} orders</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
