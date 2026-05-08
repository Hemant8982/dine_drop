import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Clock, ShieldCheck, Star } from 'lucide-react';
import api from '../lib/api';
import type { Category, MenuItem } from '../lib/types';
import FoodCard from '../components/FoodCard';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<MenuItem[]>([]);
  const [featured, setFeatured] = useState<MenuItem[]>([]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.data || [])).catch(() => {});
    api.get('/menu/popular').then(res => setPopular(res.data.data || [])).catch(() => {});
    api.get('/menu').then(res => {
      const items: MenuItem[] = res.data.data || [];
      setFeatured(items.sort(() => 0.5 - Math.random()).slice(0, 4));
    }).catch(() => {});
  }, []);

  const categoryIcons: Record<string, string> = {
    Indian: '🍛', Chinese: '🥡', Italian: '🍝', 'Fast Food': '🍔', Beverages: '🥤', Desserts: '🍰',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-orange-500/30">
              <Star size={14} /> #1 Rated Food Delivery
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
              Delicious Food,<br />
              <span className="text-orange-500">Delivered Fast</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-lg">
              Order from your favorite restaurants with just a few taps. Fresh, hot meals delivered right to your doorstep.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/menu" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-orange-500/25">
                Order Now
              </Link>
              <Link to="/menu" className="border border-gray-600 hover:border-gray-400 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all">
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Truck, title: 'Free Delivery', desc: 'On orders above $25' },
            { icon: Clock, title: '30-45 Min', desc: 'Average delivery time' },
            { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <f.icon size={22} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Categories</h2>
            <p className="text-gray-500 mt-1">Find your favorite cuisine</p>
          </div>
          <Link to="/menu" className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/menu?category=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all"
            >
              <div className="text-4xl mb-3">{categoryIcons[cat.name] || '🍽️'}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Items */}
      {popular.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Most Ordered</h2>
              <p className="text-gray-500 mt-1">Our customers' top picks</p>
            </div>
            <Link to="/menu" className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popular.slice(0, 4).map(item => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Featured / Combo Recommendations */}
      {featured.length > 0 && (
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Bought Together</h2>
              <p className="text-gray-500 mt-1">Complete your meal with these combos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Hungry? We've Got You Covered</h2>
          <p className="text-gray-400 mt-4 max-w-lg mx-auto">Order now and get your favorite meals delivered in under 45 minutes.</p>
          <Link to="/menu" className="inline-block mt-8 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-orange-500/25">
            Start Ordering
          </Link>
        </div>
      </section>
    </div>
  );
}
