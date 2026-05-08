import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Truck, ChefHat, Package, UtensilsCrossed, Hash } from 'lucide-react';
import api from '../lib/api';
import type { Order } from '../lib/types';
import StatusBadge from '../components/StatusBadge';

const deliverySteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

const dineInSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Ready to Serve', icon: UtensilsCrossed },
  { key: 'DELIVERED', label: 'Served', icon: CheckCircle2 },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/orders/${id}`)
        .then(res => setOrder(res.data.data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Order not found</p>
          <Link to="/orders" className="text-orange-500 hover:text-orange-600 mt-2 inline-block">Back to orders</Link>
        </div>
      </div>
    );
  }

  const isDineIn = order.order_type === 'DINE_IN';
  const steps = isDineIn ? dineInSteps : deliverySteps;
  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Back to Orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-gray-500 mt-1">{new Date(order.order_date).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isDineIn ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {isDineIn ? <UtensilsCrossed size={10} /> : <Truck size={10} />}
              {isDineIn ? 'Dine In' : 'Home Delivery'}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isDineIn ? 'Order Status' : 'Delivery Status'}
              </h2>
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-orange-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
              />
              {steps.map((step, i) => (
                <div key={step.key} className="relative flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    i <= currentStepIndex ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <step.icon size={18} />
                  </div>
                  <span className={`text-xs mt-2 font-medium text-center ${i <= currentStepIndex ? 'text-orange-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              {isDineIn
                ? `Estimated prep time: ${order.estimated_delivery_minutes} minutes`
                : `Estimated delivery: ${order.estimated_delivery_minutes} minutes`
              }
            </div>
          </div>
        )}

        {order.status === 'CANCELLED' && (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100 mb-6">
            <p className="text-red-600 font-medium">This order has been cancelled.</p>
          </div>
        )}

        {/* Order Type Details */}
        {isDineIn ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Hash size={18} className="text-orange-500" />
              <h2 className="font-semibold text-gray-900">Table Info</h2>
            </div>
            <p className="text-gray-600 text-sm">
              {order.table_number
                ? `Table ${order.table_number}`
                : 'No table number assigned'}
            </p>
          </div>
        ) : (
          order.delivery_address && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-orange-500" />
                <h2 className="font-semibold text-gray-900">Delivery Address</h2>
              </div>
              <p className="text-gray-600 text-sm">{order.delivery_address}</p>
            </div>
          )
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Items</h2>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <img
                    src={item.menu_item?.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100'}
                    alt={item.menu_item?.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.menu_item?.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                </div>
                <span className="font-medium text-sm">${(Number(item.price_at_time) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-orange-600 text-lg">${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
