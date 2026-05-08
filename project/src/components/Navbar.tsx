import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, UtensilsCrossed, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-400 transition-colors">
              <UtensilsCrossed size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">DineDrop</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
              Home
            </Link>
            <Link to="/menu" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/menu') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
              Menu
            </Link>
            {user && (
              <Link to="/orders" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/orders') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
                My Orders
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}>
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {user.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700">
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 w-full text-left">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <User size={16} /> Login
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-800">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-800 mt-2 pt-4 space-y-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className={`block px-4 py-2 rounded-lg text-sm font-medium ${isActive('/') ? 'bg-orange-500' : 'text-gray-300 hover:bg-gray-800'}`}>Home</Link>
            <Link to="/menu" onClick={() => setMobileOpen(false)} className={`block px-4 py-2 rounded-lg text-sm font-medium ${isActive('/menu') ? 'bg-orange-500' : 'text-gray-300 hover:bg-gray-800'}`}>Menu</Link>
            {user && (
              <Link to="/orders" onClick={() => setMobileOpen(false)} className={`block px-4 py-2 rounded-lg text-sm font-medium ${isActive('/orders') ? 'bg-orange-500' : 'text-gray-300 hover:bg-gray-800'}`}>My Orders</Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className={`block px-4 py-2 rounded-lg text-sm font-medium ${isActive('/admin') ? 'bg-orange-500' : 'text-gray-300 hover:bg-gray-800'}`}>Dashboard</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
