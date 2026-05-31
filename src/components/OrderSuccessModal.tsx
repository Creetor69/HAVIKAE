
import React from 'react';
import { Order } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface OrderSuccessModalProps {
  order: Order;
  onContinueShopping: () => void;
  onViewOrders: () => void;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onContinueShopping, onViewOrders }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
    >
      <div
        className="bg-hav-cream rounded-xl shadow-2xl w-full max-w-lg text-center p-6 md:p-8 animate-slideInUp"
      >
        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
        <h2 id="order-success-title" className="text-3xl font-serif font-bold text-hav-orange-900 mt-4">
          Thank You!
        </h2>
        <p className="mt-2 text-hav-brown">Your order has been placed successfully.</p>
        <div className="bg-hav-orange-50 border border-hav-orange-200 rounded-lg p-4 mt-6 text-left">
          <p className="font-semibold text-hav-brown">
            Order Number: <span className="font-bold text-hav-orange-800">#{order.order_number}</span>
          </p>
          <div className="border-t border-hav-orange-200 my-3"></div>
          <p className="font-semibold text-hav-brown mb-2">Order Summary:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.name} ({item.net_weight}) x {item.quantity}</span>
                <span className="font-medium">₹{((item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-hav-orange-200 my-3"></div>
          <p className="flex justify-between font-bold text-hav-brown text-lg">
            <span>Total Paid:</span>
            <span>₹{(order.total ?? 0).toFixed(2)}</span>
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onViewOrders}
            className="w-full bg-white text-hav-orange-800 font-bold py-3 px-6 rounded-full transition-transform transform hover:scale-105 shadow-md border-2 border-hav-orange-600 hover:bg-hav-orange-50"
          >
            View My Orders
          </button>
          <button
            onClick={onContinueShopping}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
