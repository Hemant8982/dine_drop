import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, UtensilsCrossed, Truck, Hash } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

type OrderType = 'HOME_DELIVERY' | 'DINE_IN';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<OrderType>('HOME_DELIVERY');
  const [address, setAddress] = useState(user?.address || '');
  const [tableNumber, setTableNumber] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [placing, setPlacing] = useState(false);

  const handlePlace = async () => {
    if (orderType === 'HOME_DELIVERY' && !address.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      toast.error('Please enter your table number');
      return;
    }
    setPlacing(true);
    try {
      const payload: Record<string, any> = { orderType };
      if (orderType === 'HOME_DELIVERY') payload.deliveryAddress = address;
      if (orderType === 'DINE_IN') payload.tableNumber = tableNumber;

      const { data } = await api.post('/orders/place', payload);
      toast.success('Order placed successfully!');
      await clearCart();
      navigate(`/orders/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Type Selector */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How would you like your order?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOrderType('HOME_DELIVERY')}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    orderType === 'HOME_DELIVERY'
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    orderType === 'HOME_DELIVERY' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Truck size={22} />
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${orderType === 'HOME_DELIVERY' ? 'text-orange-600' : 'text-gray-700'}`}>
                      Home Delivery
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">30-45 min</p>
                  </div>
                  {orderType === 'HOME_DELIVERY' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    orderType === 'DINE_IN'
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    orderType === 'DINE_IN' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <UtensilsCrossed size={22} />
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${orderType === 'DINE_IN' ? 'text-orange-600' : 'text-gray-700'}`}>
                      Dine In
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">15-25 min</p>
                  </div>
                  {orderType === 'DINE_IN' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Delivery Address (shown for HOME_DELIVERY) */}
            {orderType === 'HOME_DELIVERY' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={20} className="text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                </div>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                />
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Your contact number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            {/* Table Number (shown for DINE_IN) */}
            {orderType === 'DINE_IN' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Hash size={20} className="text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Table Details</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                    placeholder="e.g. T5, 12, Balcony-3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Your contact number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              </div>
              <div className="border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl p-6 text-center">
                <p className="text-orange-600 font-medium">
                  {orderType === 'DINE_IN' ? 'Pay at Counter' : 'Cash on Delivery'}
                </p>
                <p className="text-sm text-orange-400 mt-1">
                  {orderType === 'DINE_IN' ? 'Pay at the restaurant when your food is ready' : 'Pay when your order arrives'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mb-4 ${
                orderType === 'DINE_IN' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
              }`}>
                {orderType === 'DINE_IN' ? <UtensilsCrossed size={12} /> : <Truck size={12} />}
                {orderType === 'DINE_IN' ? 'Dine In' : 'Home Delivery'}
              </div>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 truncate block">{item.menu_item.name}</span>
                      <span className="text-gray-400">x{item.quantity}</span>
                    </div>
                    <span className="font-medium ml-2">${(Number(item.menu_item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{orderType === 'DINE_IN' ? 'Service' : 'Delivery'}</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handlePlace}
                disabled={placing}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-orange-500/25"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
