import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Search, Plus, Minus, Trash2, User, Phone, MapPin, CreditCard, 
  Truck, Calendar, Users, ShoppingBag, CheckCircle, AlertCircle, 
  X, Edit2, Save, Send, RefreshCw, Smartphone, ChevronDown, ChevronUp, ShoppingCart
} from 'lucide-react';

// Definitions of types used locally
export type OfflineCustomer = {
  id: string;
  created_at: string;
  name: string;
  mobile: string;
  is_store: boolean;
  balance_due: number;
  total_spent: number;
  last_order_date: string | null;
  order_count: number;
  notes?: string;
  address?: string;
};

export type OfflineOrderItem = {
  product_id: string;
  variant_id: string;
  name: string;
  price: number;
  quantity: number;
  net_weight: string;
};

export type OfflineOrder = {
  id: string;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  items: OfflineOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  additional: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  payment_method: 'Cash' | 'UPI' | 'Bank';
  payment_status: 'Paid Full' | 'Partial Payment' | 'Payment Pending';
  dispatch_status: 'Taken in Store' | 'Deliver Later' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Pending Dispatch' | 'Pending Payment';
  notes?: string;
  staff_name: string;
};

const DEFAULT_STAFF = ["Poornima", "Ananth", "Karthik", "Sneha"];

export default function OfflineApp() {
  // Navigation tabs
  // Tabs: 'new_sale', 'order_queue', 'customer_crm', 'inventory_sync'
  const [activeTab, setActiveTab] = useState<'new_sale' | 'order_queue' | 'customer_crm' | 'inventory_sync'>('new_sale');

  // Supabase/Offline connection state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'local_fallback'>('connected');
  const [errorLogs, setErrorLogs] = useState<string[]>([]);

  // Core entities State
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<OfflineCustomer[]>([]);
  const [orders, setOrders] = useState<OfflineOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Staff Tracking
  const [currentStaff, setCurrentStaff] = useState<string>('Poornima');

  // Page 1: New Sale States
  const [custSearchVal, setCustSearchVal] = useState<string>('');
  const [showCustAutofill, setShowCustAutofill] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [isWholesale, setIsWholesale] = useState<boolean>(false);

  // Address and mobile changes indicators (Ask whether to save if changed)
  const [originalCustDetails, setOriginalCustDetails] = useState<{mobile: string, address: string} | null>(null);
  const [askSaveAddress, setAskSaveAddress] = useState<boolean>(false);
  const [askSaveMobile, setAskSaveMobile] = useState<boolean>(false);

  // Cart States
  const [prodSearchVal, setProdSearchVal] = useState<string>('');
  const [cartItems, setCartItems] = useState<OfflineOrderItem[]>([]);
  
  // Payment and fulfillment details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid Full' | 'Partial Payment' | 'Payment Pending'>('Paid Full');
  const [fulfillment, setFulfillment] = useState<'Taken in Store' | 'Deliver Later' | 'Shipped' | 'Delivered'>('Taken in Store');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Page 2: Order Queue States
  const [queueFilter, setQueueFilter] = useState<'All' | 'Pending Dispatch' | 'Pending Payment'>('All');
  const [queueStaff, setQueueStaff] = useState<string>('All Staff');
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Page 3: Customer CRM States
  const [crmSearch, setCrmSearch] = useState<string>('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);
  const [editedCustData, setEditedCustData] = useState<Partial<OfflineCustomer>>({});

  // Page 4: Inventory States
  const [invSearch, setInvSearch] = useState<string>('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');

  // Notifications / SQL Banner
  const [showSqlGuide, setShowSqlGuide] = useState<boolean>(false);
  const [globalBanner, setGlobalBanner] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);

  // Load Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sync / Ask detection mechanics
  useEffect(() => {
    if (selectedCustomerId && originalCustDetails) {
      const addressChanged = customerAddress.trim() !== originalCustDetails.address.trim();
      setAskSaveAddress(addressChanged && customerAddress.trim().length > 0);

      const mobileChanged = customerMobile.trim() !== originalCustDetails.mobile.trim();
      setAskSaveMobile(mobileChanged && customerMobile.trim().length > 0);
    } else {
      setAskSaveAddress(false);
      setAskSaveMobile(false);
    }
  }, [customerAddress, customerMobile, selectedCustomerId, originalCustDetails]);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorLogs([]);
    let hadError = false;

    // Load Products
    try {
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*, product_variants(*)');
      
      if (prodError) throw prodError;
      if (prodData) {
        setProducts(prodData);
      }
    } catch (err: any) {
      hadError = true;
      setErrorLogs(prev => [...prev, `Products load failed: ${err.message}`]);
      // Load sample local products safely
      setProducts([
        {
          id: 'p1', name: 'Instant Sambar Premix', is_active: true, image_urls: ['/sambar.jpg'],
          product_variants: [{ id: 'pv1', net_weight: '250g', price: 304, mrp: 320, stock_quantity: 45 }]
        },
        {
          id: 'p2', name: 'Havikar SattviCool', is_active: true, image_urls: ['/sattvicool.jpg'],
          product_variants: [{ id: 'pv2', net_weight: '500g', price: 420, mrp: 450, stock_quantity: 60 }]
        },
        {
          id: 'p3', name: 'Havikar Signature Hing', is_active: true, image_urls: ['/hing.jpg'],
          product_variants: [{ id: 'pv3', net_weight: '50g', price: 200, mrp: 220, stock_quantity: 120 }]
        },
        {
          id: 'p4', name: 'Antina Unde', is_active: true, image_urls: ['/antina.jpg'],
          product_variants: [{ id: 'pv4', net_weight: '250g', price: 450, mrp: 480, stock_quantity: 30 }]
        }
      ]);
    }

    // Load Customers
    try {
      const { data: custData, error: custError } = await supabase
        .from('offline_customers')
        .select('*')
        .order('name', { ascending: true });

      if (custError) throw custError;
      if (custData) {
        setCustomers(custData);
      }
    } catch (err: any) {
      hadError = true;
      setErrorLogs(prev => [...prev, `Offline Customers load failed: ${err.message}`]);
      // Local recovery
      const savedCusts = localStorage.getItem('hav_offline_customers');
      if (savedCusts) {
        setCustomers(JSON.parse(savedCusts));
      } else {
        const sampleCusts: OfflineCustomer[] = [
          { id: 'c1', created_at: new Date().toISOString(), name: 'raj', mobile: '9988776655', is_store: false, balance_due: 0, total_spent: 608, last_order_date: '2026-04-14T12:50:59Z', order_count: 1, address: 'Bangalore, India' },
          { id: 'c2', created_at: new Date().toISOString(), name: 'rakshita dutt', mobile: '9123456789', is_store: false, balance_due: 0, total_spent: 620, last_order_date: '2026-04-14T12:37:50Z', order_count: 1, address: 'Mysore, GT Road' },
          { id: 'c3', created_at: new Date().toISOString(), name: 'Shruthi Inamdar', mobile: '8877665544', is_store: true, balance_due: 450, total_spent: 450, last_order_date: '2026-04-07T13:12:25Z', order_count: 1, address: 'Dharwad, Karnataka' }
        ];
        setCustomers(sampleCusts);
        localStorage.setItem('hav_offline_customers', JSON.stringify(sampleCusts));
      }
    }

    // Load Orders
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('offline_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;
      if (orderData) {
        setOrders(orderData);
      }
    } catch (err: any) {
      hadError = true;
      setErrorLogs(prev => [...prev, `Offline Orders load failed: ${err.message}`]);
      // Local recovery
      const savedOrders = localStorage.getItem('hav_offline_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        const sampleOrders: OfflineOrder[] = [
          {
            id: '134cc1f3',
            created_at: '2026-04-14T12:50:59Z',
            customer_id: 'c1',
            customer_name: 'raj',
            customer_mobile: '9988776655',
            customer_address: 'Bangalore, India',
            items: [
              { product_id: 'p1', variant_id: 'pv1', name: 'Instant Sambar Premix', price: 304, quantity: 2, net_weight: '250g' }
            ],
            subtotal: 608,
            discount: 0,
            shipping: 0,
            additional: 0,
            total: 608,
            amount_paid: 608,
            balance_due: 0,
            payment_method: 'UPI',
            payment_status: 'Paid Full',
            dispatch_status: 'Delivered',
            staff_name: 'Poornima',
            notes: 'Handed over directly.'
          },
          {
            id: 'bf29e7e3',
            created_at: '2026-04-14T12:37:50Z',
            customer_id: 'c2',
            customer_name: 'rakshita dutt',
            customer_mobile: '9123456789',
            customer_address: 'Mysore, GT Road',
            items: [
              { product_id: 'p2', variant_id: 'pv2', name: 'Havikar SattviCool', price: 420, quantity: 1, net_weight: '500g' },
              { product_id: 'p3', variant_id: 'pv3', name: 'Havikar Signature Hing', price: 200, quantity: 1, net_weight: '50g' }
            ],
            subtotal: 620,
            discount: 0,
            shipping: 0,
            additional: 0,
            total: 620,
            amount_paid: 620,
            balance_due: 0,
            payment_method: 'Cash',
            payment_status: 'Paid Full',
            dispatch_status: 'Delivered',
            staff_name: 'Poornima',
            notes: 'Taken immediately.'
          },
          {
            id: '1cca17cf',
            created_at: '2026-04-07T13:12:25Z',
            customer_id: 'c3',
            customer_name: 'Shruthi Inamdar',
            customer_mobile: '8877665544',
            customer_address: 'Dharwad, Karnataka',
            items: [
              { product_id: 'p4', variant_id: 'pv4', name: 'Antina Unde', price: 450, quantity: 1, net_weight: '250g' }
            ],
            subtotal: 450,
            discount: 0,
            shipping: 0,
            additional: 0,
            total: 450,
            amount_paid: 0,
            balance_due: 450,
            payment_method: 'Cash',
            payment_status: 'Payment Pending',
            dispatch_status: 'Shipped',
            staff_name: 'Poornima',
            notes: 'Pending payment from whole seller.'
          }
        ];
        setOrders(sampleOrders);
        localStorage.setItem('hav_offline_orders', JSON.stringify(sampleOrders));
      }
    }

    if (hadError) {
      setDbStatus('local_fallback');
    } else {
      setDbStatus('connected');
    }
    setLoading(false);
  };

  const syncStateToLocal = (updatedCusts: OfflineCustomer[], updatedOrders: OfflineOrder[]) => {
    localStorage.setItem('hav_offline_customers', JSON.stringify(updatedCusts));
    localStorage.setItem('hav_offline_orders', JSON.stringify(updatedOrders));
  };

  // Customer selection / autofill triggers
  const matchingCustomers = useMemo(() => {
    if (!custSearchVal || custSearchVal.length < 2) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(custSearchVal.toLowerCase()) || 
      c.mobile.includes(custSearchVal)
    );
  }, [custSearchVal, customers]);

  const handleSelectCustomer = (c: OfflineCustomer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerMobile(c.mobile);
    setCustomerAddress(c.address || '');
    setIsWholesale(c.is_store);
    setOriginalCustDetails({ mobile: c.mobile, address: c.address || '' });
    setShowCustAutofill(false);
    setCustSearchVal('');
  };

  // Cart Management
  const searchMatchingProducts = useMemo(() => {
    if (!prodSearchVal) return [];
    return products.flatMap(p => {
      const activeVariants = (p.product_variants || []).filter((v: any) => v);
      return activeVariants.map((v: any) => ({
        product: p,
        variant: v,
        label: `${p.name} (${v.net_weight || ''}) - ₹${v.price}`
      }));
    }).filter(item => 
      item.product.name.toLowerCase().includes(prodSearchVal.toLowerCase()) ||
      (item.variant.net_weight && item.variant.net_weight.toLowerCase().includes(prodSearchVal.toLowerCase()))
    );
  }, [prodSearchVal, products]);

  const addVariantToCart = (prod: any, variant: any) => {
    const existing = cartItems.find(item => item.variant_id === variant.id);
    if (existing) {
      setCartItems(prev => prev.map(item => 
        item.variant_id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems(prev => [...prev, {
        product_id: prod.id,
        variant_id: variant.id,
        name: prod.name,
        price: variant.price,
        quantity: 1,
        net_weight: variant.net_weight
      }]);
    }
    setProdSearchVal('');
  };

  const updateCartQty = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.variant_id !== variantId));
    } else {
      setCartItems(prev => prev.map(item => 
        item.variant_id === variantId ? { ...item, quantity } : item
      ));
    }
  };

  // Order Pricing Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((curr, item) => curr + (item.price * item.quantity), 0);
  }, [cartItems]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - overallDiscount + shippingCharges + additionalCharges);
  }, [subtotal, overallDiscount, shippingCharges, additionalCharges]);

  // Submit Sale Handler
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Please add at least one product to the Cart!");
      return;
    }
    if (!customerName.trim()) {
      alert("Customer Name is required!");
      return;
    }
    if (!customerMobile.trim()) {
      alert("Customer Mobile number is required!");
      return;
    }

    setLoading(true);

    let customerId = selectedCustomerId;
    let updatedCusts = [...customers];

    // If customer is changing details or brand new, handle database update logic
    if (!customerId) {
      // Prompt/Generate brand new offline customer
      const newCust: OfflineCustomer = {
        id: 'cust-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        name: customerName,
        mobile: customerMobile,
        is_store: isWholesale,
        balance_due: paymentStatus !== 'Paid Full' ? (finalTotal - (paymentStatus === 'Partial Payment' ? finalTotal / 2 : 0)) : 0,
        total_spent: paymentStatus !== 'Payment Pending' ? finalTotal : 0,
        last_order_date: new Date().toISOString(),
        order_count: 1,
        address: customerAddress,
        notes: ''
      };

      // Attempt DB Insert
      if (dbStatus === 'connected') {
        try {
          const { error } = await supabase.from('offline_customers').insert(newCust);
          if (error) throw error;
        } catch (e: any) {
          console.warn("DB Customer save failed, keeping offline mode:", e);
        }
      }

      updatedCusts.push(newCust);
      customerId = newCust.id;
    } else {
      // Selected customer exists. Check toggles to save changes
      let customerToUpdate = updatedCusts.find(c => c.id === customerId);
      if (customerToUpdate) {
        const payloadToUpdate: Partial<OfflineCustomer> = {
          order_count: (customerToUpdate.order_count || 0) + 1,
          last_order_date: new Date().toISOString(),
          total_spent: (customerToUpdate.total_spent || 0) + (paymentStatus !== 'Payment Pending' ? finalTotal : 0),
          balance_due: (customerToUpdate.balance_due || 0) + (paymentStatus !== 'Paid Full' ? (finalTotal - (paymentStatus === 'Partial Payment' ? finalTotal / 2 : 0)) : 0),
        };

        if (askSaveAddress) {
          payloadToUpdate.address = customerAddress;
        }
        if (askSaveMobile) {
          payloadToUpdate.mobile = customerMobile;
        }

        // Apply to local state
        updatedCusts = updatedCusts.map(c => c.id === customerId ? { ...c, ...payloadToUpdate } : c);

        // Save to Supabase
        if (dbStatus === 'connected') {
          try {
            const { error } = await supabase.from('offline_customers').update(payloadToUpdate).eq('id', customerId);
            if (error) throw error;
          } catch (e: any) {
            console.warn("DB Customer update failed:", e);
          }
        }
      }
    }

    // Build the order record
    const discountVal = overallDiscount;
    const paidAmt = paymentStatus === 'Paid Full' ? finalTotal : (paymentStatus === 'Partial Payment' ? finalTotal / 2 : 0);
    const balanceDue = finalTotal - paidAmt;

    const newOrder: OfflineOrder = {
      id: 'ord-' + Math.random().toString(36).substr(2, 8),
      created_at: new Date().toISOString(),
      customer_id: customerId,
      customer_name: customerName,
      customer_mobile: customerMobile,
      customer_address: customerAddress,
      items: [...cartItems],
      subtotal,
      discount: discountVal,
      shipping: shippingCharges,
      additional: additionalCharges,
      total: finalTotal,
      amount_paid: paidAmt,
      balance_due: balanceDue,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      dispatch_status: fulfillment,
      notes: orderNotes,
      staff_name: currentStaff
    };

    const updatedOrders = [newOrder, ...orders];

    if (dbStatus === 'connected') {
      try {
        const { error } = await supabase.from('offline_orders').insert(newOrder);
        if (error) throw error;
      } catch (e: any) {
        console.warn("DB order insert error, using offline store:", e);
      }
    }

    // Sync state
    setCustomers(updatedCusts);
    setOrders(updatedOrders);
    syncStateToLocal(updatedCusts, updatedOrders);

    // Reset checkout form
    setCartItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setIsWholesale(false);
    setSelectedCustomerId('');
    setOriginalCustDetails(null);
    setOverallDiscount(0);
    setShippingCharges(0);
    setAdditionalCharges(0);
    setOrderNotes('');
    setPaymentMethod('Cash');
    setPaymentStatus('Paid Full');
    setFulfillment('Taken in Store');

    setGlobalBanner({
      type: 'success',
      text: `Successfully registered Order #${newOrder.id.split('-')[1].toUpperCase()} by ${currentStaff}!`
    });
    setLoading(false);
    setActiveTab('order_queue');
  };

  // Order State Actions (Queue Actions)
  const updateOrderPaymentStatus = async (orderId: string, status: 'Paid Full' | 'Partial Payment' | 'Payment Pending', isToggle = false) => {
    let orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    let nextPaid = orderToUpdate.total;
    if (status === 'Partial Payment') nextPaid = orderToUpdate.total / 2;
    if (status === 'Payment Pending') nextPaid = 0;

    const balanceDue = orderToUpdate.total - nextPaid;

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          payment_status: status,
          amount_paid: nextPaid,
          balance_due: balanceDue
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    syncStateToLocal(customers, updatedOrders);

    // Sync database with Supabase
    if (dbStatus === 'connected') {
      try {
        await supabase.from('offline_orders').update({
          payment_status: status,
          amount_paid: nextPaid,
          balance_due: balanceDue
        }).eq('id', orderId);
      } catch (e) {
        console.warn("Failed database order update:", e);
      }
    }
  };

  const updateOrderDispatchStatus = async (orderId: string, status: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, dispatch_status: status as any };
      }
      return o;
    });

    setOrders(updatedOrders);
    syncStateToLocal(customers, updatedOrders);

    if (dbStatus === 'connected') {
      try {
        await supabase.from('offline_orders').update({ dispatch_status: status }).eq('id', orderId);
      } catch (e) {
        console.warn("Failed database dispatch status update:", e);
      }
    }
  };

  // WhatsApp formatted message generator & trigger
  const triggerWhatsApp = (order: OfflineOrder) => {
    const mobileSanitized = order.customer_mobile.replace(/[^\d]/g, '');
    let orderSummary = order.items.map(item => `${item.quantity}x ${item.name} (${item.net_weight})`).join(', ');
    
    const messageText = `Hello ${order.customer_name}, peace from Havikar! 🌸\n\nYour order #${order.id.split('-')[1].toUpperCase()} details:\nItems: ${orderSummary}\nTotal price: ₹${order.total}\nPayment Status: ${order.payment_status} (${order.payment_method})\nFulfillment: ${order.dispatch_status}\n\nThank you for shopping with us! Let us know if you need any adjustments.`;
    
    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${mobileSanitized.startsWith('91') ? mobileSanitized : '91' + mobileSanitized}&text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Filtered Orders for the Queue
  const filteredQueueOrders = useMemo(() => {
    return orders.filter(o => {
      // 1. Queue type filters
      if (queueFilter === 'Pending Dispatch' && ['Delivered', 'Cancelled'].includes(o.dispatch_status)) {
        return false;
      }
      if (queueFilter === 'Pending Payment' && o.payment_status === 'Paid Full') {
        return false;
      }

      // 2. Staff filter
      if (queueStaff !== 'All Staff' && o.staff_name !== queueStaff) {
        return false;
      }

      // 3. Search text matching ID, name or mobile
      if (queueSearch) {
        const query = queueSearch.toLowerCase();
        return (
          o.id.toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_mobile.includes(query) ||
          o.staff_name.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [orders, queueFilter, queueStaff, queueSearch]);

  // CRM expanded customer handler
  const handleOpenEditCustomer = (c: OfflineCustomer) => {
    setEditedCustData(c);
    setIsEditingCustomer(true);
  };

  const handleSaveCustomerEdits = async () => {
    if (!editedCustData.id) return;
    
    const updatedCusts = customers.map(c => 
      c.id === editedCustData.id ? { ...c, ...editedCustData } : c
    );

    setCustomers(updatedCusts);
    syncStateToLocal(updatedCusts, orders);
    
    if (dbStatus === 'connected') {
      try {
        const { error } = await supabase
          .from('offline_customers')
          .update({
            name: editedCustData.name,
            mobile: editedCustData.mobile,
            address: editedCustData.address,
            is_store: editedCustData.is_store,
            notes: editedCustData.notes,
          })
          .eq('id', editedCustData.id);
        if (error) throw error;
      } catch (err: any) {
        alert("Failed to sync customer changes with backend database: " + err.message);
      }
    }

    setIsEditingCustomer(false);
    setGlobalBanner({ type: 'success', text: `Successfully updated customer profile for ${editedCustData.name}!` });
  };

  // Stock management edits
  const startEditingStock = (pvId: string, currentStock: number) => {
    setEditingStockId(pvId);
    setTempStockValue(currentStock.toString());
  };

  const handleSaveStockLocal = async (pId: string, pvId: string) => {
    const nextStock = parseInt(tempStockValue);
    if (isNaN(nextStock) || nextStock < 0) {
      alert("Invalid stock amount!");
      return;
    }

    // Update in UI Products representation
    const updatedProds = products.map(p => {
      if (p.id === pId) {
        const updatedVariants = p.product_variants.map((pv: any) => 
          pv.id === pvId ? { ...pv, stock_quantity: nextStock } : pv
        );
        return { ...p, product_variants: updatedVariants };
      }
      return p;
    });

    setProducts(updatedProds);
    setEditingStockId(null);

    // Sync back directly to Supabase product_variants
    if (dbStatus === 'connected') {
      try {
        const { error } = await supabase
          .from('product_variants')
          .update({ stock_quantity: nextStock })
          .eq('id', pvId);
          
        if (error) {
          throw error;
        } else {
          setGlobalBanner({ type: 'success', text: `Live DB stock updated successfully!` });
        }
      } catch (e: any) {
        alert("Failed to sync on Supabase: " + e.message);
      }
    } else {
      setGlobalBanner({ type: 'info', text: "Stock updated in local cache! Set up live database SQL to sync permanently." });
    }
  };

  // SQL Script generator for the user
  const SQL_UPDATE_COMMANDS = `-- EXECUTE THIS IN YOUR SUPABASE SQL EDITOR TO SETUP OFFLINE POS SCHEMAS:

-- 1. Create Offline Customers Table
CREATE TABLE IF NOT EXISTS offline_customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    is_store BOOLEAN DEFAULT false,
    balance_due REAL DEFAULT 0.0,
    total_spent REAL DEFAULT 0.0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    order_count INT DEFAULT 0,
    notes TEXT,
    address TEXT
);

-- 2. Create Offline Orders Table
CREATE TABLE IF NOT EXISTS offline_orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_id TEXT REFERENCES offline_customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_address TEXT,
    items JSONB NOT NULL,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0.0,
    shipping REAL DEFAULT 0.0,
    additional REAL DEFAULT 0.0,
    total REAL NOT NULL,
    amount_paid REAL DEFAULT 0.0,
    balance_due REAL DEFAULT 0.0,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    dispatch_status TEXT NOT NULL,
    notes TEXT,
    staff_name TEXT DEFAULT 'Poornima'
);

-- Enable RLS & Policies
ALTER TABLE offline_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write offline customers" ON offline_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write offline orders" ON offline_orders FOR ALL USING (true) WITH CHECK (true);
`;

  return (
    <div className="min-h-screen bg-hav-cream text-hav-olive flex flex-col font-sans select-none selection:bg-hav-gold/30">
      {/* Header */}
      <header className="bg-hav-forest text-hav-gold shadow-lg py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center border-b border-hav-gold/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-hav-gold text-hav-forest rounded-full font-black animate-pulse">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-extrabold tracking-tight">Havikar POS</h1>
            <p className="text-[10px] text-hav-cream/80 uppercase font-black tracking-widest mt-0.5">Offline Store POS & CRM Control Panel</p>
          </div>
        </div>

        {/* Database Status Tracker */}
        <div className="flex items-center gap-4 mt-3 md:mt-0 flex-wrap">
          {/* Staff selection */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-[9px] font-black uppercase text-hav-cream/60">Active Staff:</span>
            <select 
              value={currentStaff} 
              onChange={e => setCurrentStaff(e.target.value)}
              className="bg-transparent text-sm font-bold text-hav-gold border-none outline-none focus:ring-0 cursor-pointer"
            >
              {DEFAULT_STAFF.map(st => (
                <option key={st} value={st} className="bg-hav-forest text-hav-gold font-bold">{st}</option>
              ))}
            </select>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
            dbStatus === 'connected' 
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-900/40 text-amber-300 border-amber-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            {dbStatus === 'connected' ? 'Live DB Synced' : 'Database Offline Mode'}
            {dbStatus === 'local_fallback' && (
              <button 
                onClick={() => setShowSqlGuide(prev => !prev)} 
                className="ml-1 px-1.5 py-0.5 bg-amber-500 text-hav-forest rounded text-[9px] font-black uppercase hover:scale-105 active:scale-95 transition-transform"
              >
                SQL Fix
              </button>
            )}
          </div>

          <button 
            onClick={fetchInitialData} 
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-hav-gold rounded-full transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SQL Setup Drawer/Accordion */}
      {showSqlGuide && (
        <div className="bg-amber-50 border-y border-amber-200/50 p-6 md:px-12 animate-fadeIn relative">
          <button 
            onClick={() => setShowSqlGuide(false)} 
            className="absolute top-4 right-4 text-amber-800 hover:text-amber-950"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-black uppercase text-amber-900 tracking-wider flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Supabase SQL Database Update Instructions
            </h3>
            <p className="text-xs text-amber-800 mb-4 leading-relaxed">
              We detected that the <strong>offline_customers</strong> and <strong>offline_orders</strong> tables are missing in your Supabase database stack, so POS is operating on safe offline-local storage mode! To configure persistence permanently, copy the SQL below and run it in your <strong>Supabase Client Editor SQL query field</strong>:
            </p>
            <pre className="bg-zinc-950 text-emerald-400 text-[10px] md:text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-56 border border-white/5 select-all leading-normal">
              {SQL_UPDATE_COMMANDS}
            </pre>
          </div>
        </div>
      )}

      {/* Global alert feedback banner */}
      {globalBanner && (
        <div className={`p-3 text-center text-xs font-bold transition-all animate-slideDown flex justify-between items-center px-12 ${
          globalBanner.type === 'success' ? 'bg-emerald-950 text-emerald-300' :
          globalBanner.type === 'error' ? 'bg-red-950 text-red-300' : 'bg-sky-950 text-sky-300'
        }`}>
          <div className="mx-auto flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {globalBanner.text}
          </div>
          <button onClick={() => setGlobalBanner(null)} className="opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Bars */}
      <div className="bg-hav-forest/95 backdrop-blur-sm border-b border-hav-gold/15 sticky top-0 z-50 py-1.5 px-4 flex justify-center gap-2 flex-shrink-0">
        <button 
          onClick={() => setActiveTab('new_sale')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'new_sale' 
              ? 'bg-hav-gold text-hav-forest shadow-lg scale-105' 
              : 'text-hav-cream/80 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          New Sale
        </button>

        <button 
          onClick={() => setActiveTab('order_queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'order_queue' 
              ? 'bg-hav-gold text-hav-forest shadow-lg scale-105' 
              : 'text-hav-cream/80 hover:bg-white/5 hover:text-white'
          }`}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          Order Queue
          {orders.filter(o => o.dispatch_status !== 'Delivered' && o.dispatch_status !== 'Cancelled').length > 0 && (
            <span className="bg-red-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-black animate-bounce">
              {orders.filter(o => o.dispatch_status !== 'Delivered' && o.dispatch_status !== 'Cancelled').length}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('customer_crm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'customer_crm' 
              ? 'bg-hav-gold text-hav-forest shadow-lg scale-105' 
              : 'text-hav-cream/80 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Customer CRM
        </button>

        <button 
          onClick={() => setActiveTab('inventory_sync')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'inventory_sync' 
              ? 'bg-hav-gold text-hav-forest shadow-lg scale-105' 
              : 'text-hav-cream/80 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Store Core Inventory
        </button>
      </div>

      {/* Main Board Space */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-hav-cream/70 backdrop-blur-xs flex flex-col items-center justify-center z-50">
            <RefreshCw className="w-10 h-10 text-hav-forest animate-spin mb-2" />
            <span className="text-xs font-black uppercase tracking-widest text-hav-olive">Syncing datasets...</span>
          </div>
        )}

        {/* -------------------- 1. PAGE: NEW SALE -------------------- */}
        {activeTab === 'new_sale' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            {/* Left Box: Customer Identify and Pricing Inputs */}
            <div className="lg:col-span-4 space-y-6">
              {/* Customer Box */}
              <div className="bg-white p-6 rounded-[2rem] shadow-md border border-hav-olive/5 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-hav-forest flex items-center gap-2">
                    <User className="w-4 h-4 text-hav-gold" />
                    Customer Identification
                  </h3>
                  {selectedCustomerId && (
                    <button 
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerName('');
                        setCustomerMobile('');
                        setCustomerAddress('');
                        setOriginalCustDetails(null);
                        setIsWholesale(false);
                      }} 
                      className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold uppercase transition-colors hover:bg-red-100"
                    >
                      Clear Customer
                    </button>
                  )}
                </div>

                {/* Autocomplete Input Search */}
                <div className="relative mb-4">
                  <label className="text-[10px] font-black uppercase text-hav-gold/80 block mb-1">Autocomplete Database Search (Name/Mobile)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hav-brown/40" />
                    <input 
                      type="text"
                      value={custSearchVal}
                      onChange={e => {
                        setCustSearchVal(e.target.value);
                        setShowCustAutofill(true);
                      }}
                      placeholder="Type 2+ characters..." 
                      className="w-full bg-hav-cream/40 border border-hav-gold/20 rounded-xl py-2 px-3 pl-9 text-sm text-hav-brown font-bold focus:outline-none focus:ring-2 focus:ring-hav-gold/50"
                    />
                  </div>

                  {/* Customer Autofill dropdown list */}
                  {showCustAutofill && matchingCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-hav-gold/20 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      {matchingCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-hav-cream/50 border-b border-hav-cream/20 text-xs flex justify-between items-center transition-colors font-semibold"
                        >
                          <div>
                            <p className="font-bold text-hav-forest capitalize">{c.name}</p>
                            <p className="text-[10px] text-hav-olive opacity-80">{c.mobile}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${c.is_store ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                            {c.is_store ? 'Wholesale' : 'Retail'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showCustAutofill && custSearchVal.length >= 2 && matchingCustomers.length === 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-amber-50/95 border border-amber-200/50 rounded-xl py-2.5 px-4 text-[10px] text-amber-800 font-bold z-50 shadow-md">
                      ⚠️ No existing records found. Simply type details below to register customer!
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Customer Name</label>
                    <input 
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Enter customer name..." 
                      className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-sm text-hav-brown font-bold focus:outline-none focus:ring-2 focus:ring-hav-gentle"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Mobile Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hav-brown/40" />
                      <input 
                        type="text"
                        value={customerMobile}
                        onChange={e => setCustomerMobile(e.target.value)}
                        placeholder="Enter mobile..." 
                        className="w-full pl-9 border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-sm text-hav-brown font-bold focus:outline-none focus:ring-2 focus:ring-hav-gentle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Address (Optional)</label>
                    <textarea 
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder="Enter address..." 
                      rows={2}
                      className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-sm text-hav-brown font-bold focus:outline-none focus:ring-2 focus:ring-hav-gentle resize-none"
                    />
                  </div>

                  {/* Ask to update flags */}
                  {askSaveAddress && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 transition-all font-semibold space-y-1 flex items-center justify-between">
                      <span>Changed address. Save to CRM?</span>
                      <input 
                        type="checkbox" 
                        checked={askSaveAddress} 
                        onChange={e => setAskSaveAddress(e.target.checked)}
                        className="rounded text-hav-gold focus:ring-hav-gold cursor-pointer"
                      />
                    </div>
                  )}

                  {askSaveMobile && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 transition-all font-semibold space-y-1 flex items-center justify-between">
                      <span>Update phone number in CRM?</span>
                      <input 
                        type="checkbox" 
                        checked={askSaveMobile} 
                        onChange={e => setAskSaveMobile(e.target.checked)}
                        className="rounded text-hav-gold focus:ring-hav-gold cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-hav-cream">
                    <div>
                      <p className="text-xs font-black text-hav-forest">Wholesale / Store Customer</p>
                      <p className="text-[9px] text-hav-olive opacity-80">Toggle custom price or tracking</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWholesale(!isWholesale)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isWholesale ? 'bg-hav-gold' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isWholesale ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkout details Section */}
              <div className="bg-white p-6 rounded-[2rem] shadow-md border border-hav-olive/5 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-hav-forest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-hav-gold" />
                  Payment & Delivery Status
                </h3>

                <div>
                  <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Payment Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'UPI', 'Bank'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentMethod(type as any)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs uppercase transition-all ${
                          paymentMethod === type 
                            ? 'bg-hav-forest text-hav-gold ring-2 ring-hav-gold/50 shadow-md' 
                            : 'bg-hav-cream/30 border border-hav-gold/10 hover:bg-hav-cream/60'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Payment Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Paid Full', 'Partial Payment', 'Payment Pending'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentStatus(type as any)}
                        className={`py-1.5 px-1 rounded-xl font-bold text-[9px] uppercase tracking-wider text-center transition-all ${
                          paymentStatus === type 
                            ? 'bg-hav-forest text-hav-gold ring-2 ring-hav-gold/50 shadow-md' 
                            : 'bg-hav-cream/30 border border-hav-gold/10 hover:bg-hav-cream/60'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Fulfillment Status</label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Taken in Store', 'Deliver Later', 'Shipped', 'Delivered'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFulfillment(type as any)}
                        className={`py-1.5 px-1 rounded-lg font-black text-[8px] uppercase tracking-widest text-center transition-all ${
                          fulfillment === type 
                            ? 'bg-hav-gold text-hav-forest shadow-md border-hav-gold' 
                            : 'bg-hav-cream/30 border border-hav-gold/10 hover:bg-hav-cream/60'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Order Cart and Search */}
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-md border border-hav-olive/5 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-hav-cream">
                <h3 className="text-lg font-serif font-black text-hav-forest flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-hav-gold" />
                  Order Cart Checkout
                </h3>
                <span className="text-xs bg-hav-cream text-hav-brown px-3 py-1.5 rounded-full font-bold">
                  Items: {cartItems.reduce((acc, c) => acc + c.quantity, 0)}
                </span>
              </div>

              {/* Product search register filter */}
              <div>
                <label className="text-[10px] font-black uppercase text-hav-gold block mb-1.5">Interactive Product Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-hav-brown/40" />
                  <input 
                    type="text"
                    value={prodSearchVal}
                    onChange={e => setProdSearchVal(e.target.value)}
                    placeholder="Search product variant by name or size..." 
                    className="w-full bg-hav-cream/30 border border-hav-gold/25 rounded-xl py-3 px-4 pl-11 text-sm font-bold text-hav-brown placeholder:text-hav-brown/40 focus:outline-none focus:ring-2 focus:ring-hav-gold/50"
                  />
                </div>

                {/* Dropdown matched list */}
                {prodSearchVal && searchMatchingProducts.length > 0 && (
                  <div className="bg-white border border-hav-gold/20 rounded-xl mt-1.5 shadow-2xl overflow-hidden max-h-56 overflow-y-auto z-40 relative">
                    {searchMatchingProducts.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => addVariantToCart(item.product, item.variant)}
                        className="w-full text-left p-3 hover:bg-hav-cream/40 border-b border-hav-cream/20 flex justify-between items-center transition-colors text-xs"
                      >
                        <div>
                          <p className="font-extrabold text-hav-forest">{item.product.name}</p>
                          <p className="text-[10px] text-hav-olive opacity-85 mt-0.5">Net Weight: <strong className="text-hav-brown">{item.variant.net_weight}</strong> | Stock: <strong className="text-hav-brown">{item.variant.stock_quantity ?? 'N/A'}</strong></p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-hav-brown">₹{item.variant.price}</p>
                          {item.variant.mrp && item.variant.mrp > item.variant.price && (
                            <p className="text-[9px] line-through text-red-500">₹{item.variant.mrp}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {prodSearchVal && searchMatchingProducts.length === 0 && (
                  <p className="text-[10px] text-amber-800 font-bold bg-amber-50 p-2.5 rounded-xl mt-1.5 border border-amber-100">
                    ⚠️ No products match your search. Make sure spellings correspond to database!
                  </p>
                )}
              </div>

              {/* Cart contents table */}
              <div className="overflow-x-auto rounded-2xl border border-hav-cream">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-hav-cream/50 text-[10px] font-black uppercase tracking-wider text-hav-forest border-b border-hav-cream">
                      <th className="p-4">Product Variant</th>
                      <th className="p-4 text-center">Price</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4 text-right">Total</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hav-cream text-xs font-bold text-hav-olive">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-hav-brown/50 italic bg-hav-cream/5">
                          🎁 No items in cart. Search products above to add.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-hav-cream/10 transition-colors">
                          <td className="p-4">
                            <p className="text-hav-forest font-bold text-sm tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-medium text-hav-brown opacity-80 mt-0.5">Weight: {item.net_weight}</p>
                          </td>
                          <td className="p-4 text-center text-hav-brown">₹{item.price}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => updateCartQty(item.variant_id, item.quantity - 1)}
                                className="p-1.5 bg-hav-cream/50 rounded-lg hover:bg-hav-cream text-hav-forest transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQty(item.variant_id, item.quantity + 1)}
                                className="p-1.5 bg-hav-cream/50 rounded-lg hover:bg-hav-cream text-hav-forest transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right text-hav-forest text-sm font-black">₹{item.price * item.quantity}</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => updateCartQty(item.variant_id, 0)}
                              className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* pricing calculation boxes */}
              <div className="bg-hav-cream/10 p-6 rounded-3xl border border-hav-gold/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Adjustments fields */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Overall Discount (₹)</label>
                      <input 
                        type="number"
                        value={overallDiscount || ''}
                        onChange={e => setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="Discount" 
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-xs text-hav-brown font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Shipping Charges (₹)</label>
                      <input 
                        type="number"
                        value={shippingCharges || ''}
                        onChange={e => setShippingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="Shipping" 
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-xs text-hav-brown font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Additional Charges (₹)</label>
                    <input 
                      type="number"
                      value={additionalCharges || ''}
                      onChange={e => setAdditionalCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="Additional" 
                      className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-xs text-hav-brown font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Order Notes / Instructions</label>
                    <textarea 
                      value={orderNotes}
                      onChange={e => setOrderNotes(e.target.value)}
                      placeholder="Add any special instructions..." 
                      rows={2}
                      className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-xs text-hav-brown font-bold focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Subtotal Calculation details */}
                <div className="flex flex-col justify-between bg-hav-forest p-6 rounded-2xl text-hav-cream/90 shadow-inner">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs opacity-90">
                      <span>Subtotal</span>
                      <span className="font-extrabold">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-red-300">
                      <span>Discount Given</span>
                      <span className="font-extrabold">- ₹{overallDiscount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-90">
                      <span>Shipping Rate</span>
                      <span className="font-extrabold">+ ₹{shippingCharges}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-90">
                      <span>Additional Rate</span>
                      <span className="font-extrabold">+ ₹{additionalCharges}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black uppercase text-hav-gold tracking-wider">Final Order Total (₹)</p>
                      <p className="text-[8px] opacity-60">Auto-calculates discount</p>
                    </div>
                    <span className="text-3xl font-serif font-black text-hav-gold">
                      ₹{finalTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Submission button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full bg-hav-forest text-hav-gold hover:text-hav-forest hover:bg-hav-gold border border-hav-gold/30 disabled:bg-gray-400 disabled:text-gray-200 disabled:border-none font-black py-4 px-8 rounded-2xl tracking-widest uppercase text-sm cursor-pointer shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2"
              >
                <CheckCircle className="w-4.5 h-4.5" />
                Register Sales Slip and Sync Profile
              </button>
            </div>
          </div>
        )}

        {/* -------------------- 2. PAGE: ORDER QUEUE -------------------- */}
        {activeTab === 'order_queue' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter controls */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-hav-olive/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase text-hav-gold tracking-widest mr-2 block">Queue Filters:</span>
                {['All', 'Pending Dispatch', 'Pending Payment'].map((filt: any) => (
                  <button
                    key={filt}
                    onClick={() => setQueueFilter(filt)}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                      queueFilter === filt 
                        ? 'bg-hav-forest text-hav-gold shadow-md' 
                        : 'bg-hav-cream/40 text-hav-olive hover:bg-hav-cream'
                    }`}
                  >
                    {filt}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-auto items-center flex-grow md:justify-end max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hav-brown/40" />
                  <input 
                    type="text"
                    value={queueSearch}
                    onChange={e => setQueueSearch(e.target.value)}
                    placeholder="Search ID, name or mobile..." 
                    className="w-full pl-9 py-2 px-3 border border-hav-orange-200 rounded-xl bg-hav-cream/25 text-xs text-hav-olive font-bold focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[9px] font-black uppercase opacity-60">Staff:</span>
                  <select
                    value={queueStaff}
                    onChange={e => setQueueStaff(e.target.value)}
                    className="border border-hav-orange-200 rounded-xl py-1.5 px-3 bg-white text-xs text-hav-olive font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="All Staff">All Staff</option>
                    {DEFAULT_STAFF.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List of queue orders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQueueOrders.length === 0 ? (
                <div className="col-span-full bg-white p-16 rounded-[2rem] text-center text-hav-brown/60 italic border border-hav-olive/5">
                  📭 No orders found matching the filter selection in active registry.
                </div>
              ) : (
                filteredQueueOrders.map((order) => {
                  const itemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  const isDelivered = order.dispatch_status === 'Delivered';
                  const isShipped = order.dispatch_status === 'Shipped';
                  const isPendingPayment = order.payment_status === 'Payment Pending';

                  return (
                    <div 
                      key={order.id} 
                      className={`bg-white rounded-[2rem] p-6 shadow-md border flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                        order.dispatch_status === 'Cancelled' ? 'border-red-100 opacity-60' :
                        isDelivered ? 'border-emerald-100 bg-emerald-50/5' : 'border-hav-gold/20'
                      }`}
                    >
                      {/* Card block details */}
                      <div>
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-hav-cream">
                          <div>
                            <span className="font-mono text-xs text-hav-gold bg-hav-cream/60 py-1 px-2 rounded-lg font-black uppercase tracking-wider">
                              #{order.id.split('-').pop()?.toUpperCase()}
                            </span>
                            <p className="text-[9px] text-hav-olive opacity-75 mt-1">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase block text-hav-forest">
                              👤 {order.staff_name}
                            </span>
                          </div>
                        </div>

                        {/* Customer block */}
                        <div className="space-y-1 mb-4">
                          <p className="text-sm font-black text-hav-forest capitalize">{order.customer_name}</p>
                          <p className="text-[10px] text-hav-olive flex items-center gap-1">
                            <Phone className="w-3 h-3 text-hav-gold" />
                            {order.customer_mobile || 'No Mobile'}
                          </p>
                          {order.customer_address && (
                            <p className="text-[10px] text-hav-brown opacity-85 flex items-center gap-1 leading-tight line-clamp-2">
                              <MapPin className="w-3 h-3 text-hav-gold shrink-0" />
                              {order.customer_address}
                            </p>
                          )}
                        </div>

                        {/* Items list */}
                        <div className="bg-hav-cream/20 p-3.5 rounded-xl text-xs space-y-1.5 mb-4 max-h-36 overflow-y-auto">
                          {order.items.map((it, iIdx) => (
                            <div key={iIdx} className="flex justify-between items-center text-hav-olive">
                              <span className="font-semibold line-clamp-1 flex-1">
                                <strong className="text-hav-forest">{it.quantity}x</strong> {it.name} <span className="opacity-80 text-[10px]">({it.net_weight})</span>
                              </span>
                              <span className="font-black shrink-0 ml-2">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary and payment details footer */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-t border-hav-cream pt-3 text-xs">
                          <span className="text-[10px] font-black uppercase tracking-wider text-hav-brown opacity-75">
                            {order.payment_method} • {order.payment_status}
                          </span>
                          <span className="text-base font-black text-hav-forest">
                            ₹{order.total}
                          </span>
                        </div>

                        {/* Order status badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            isDelivered ? 'bg-emerald-100 text-emerald-800' :
                            isShipped ? 'bg-indigo-100 text-indigo-800' :
                            order.dispatch_status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            🚚 {order.dispatch_status}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            order.payment_status === 'Paid Full' ? 'bg-emerald-100 text-emerald-800' :
                            order.payment_status === 'Partial Payment' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                          }`}>
                            💰 {order.payment_status}
                          </span>
                        </div>

                        {/* Customer Notes */}
                        {order.notes && (
                          <p className="text-[10px] bg-amber-50 text-amber-900 border border-amber-100 p-2 rounded-xl italic leading-tight">
                            📝 {order.notes}
                          </p>
                        )}

                        {/* Action buttons matching exact layout required */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hav-cream">
                          {isDelivered ? (
                            <>
                              <button 
                                onClick={() => updateOrderPaymentStatus(order.id, 'Paid Full')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-2.5 px-1.5 rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                              >
                                Paid Full
                              </button>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Shipped')}
                                className="bg-hav-cream/60 hover:bg-hav-cream text-hav-forest text-[9px] font-black py-2.5 px-1.5 rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                              >
                                Unmark Delivered
                              </button>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Cancelled')}
                                className="col-span-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-black py-2 px-1.5 rounded-xl uppercase tracking-wider transition-colors border border-rose-150 cursor-pointer"
                              >
                                Return/Refund Item
                              </button>
                            </>
                          ) : isShipped ? (
                            <>
                              <button 
                                onClick={() => triggerWhatsApp(order)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Send Message
                              </button>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Taken in Store')}
                                className="bg-hav-cream hover:bg-hav-cream/80 text-hav-forest text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              >
                                Unmark Shipped
                              </button>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Delivered')}
                                className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2.5 px-1.5 rounded-xl uppercase tracking-widest transition-colors shadow-md cursor-pointer"
                              >
                                Mark Delivered
                              </button>
                              <button 
                                onClick={() => alert("Marked delivery problem! Flagged for staff review.")}
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-[8px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all border border-yellow-250 cursor-pointer"
                              >
                                Mark Problem
                              </button>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Cancelled')}
                                className="bg-red-50 hover:bg-red-100 text-red-600 text-[8px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all border border-red-150 cursor-pointer"
                              >
                                Cancel Order
                              </button>
                              <button 
                                onClick={() => updateOrderPaymentStatus(order.id, 'Paid Full')}
                                className="col-span-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[9px] font-black py-2 px-1 text-center rounded-xl uppercase tracking-widest transition-all border border-teal-150 cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            </>
                          ) : (
                            // Draft or Taken in Store
                            <>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Shipped')}
                                className="bg-hav-forest text-hav-gold hover:bg-hav-forest/90 text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              >
                                Dispatch Order
                              </button>
                              <button 
                                onClick={() => updateOrderDispatchStatus(order.id, 'Delivered')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              >
                                Direct Handover
                              </button>
                              <button 
                                onClick={() => triggerWhatsApp(order)}
                                className="col-span-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-3 h-3 text-emerald-800" />
                                WhatsApp Bill details
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* -------------------- 3. PAGE: CUSTOMER CRM -------------------- */}
        {activeTab === 'customer_crm' && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-md border border-hav-olive/5 space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-hav-cream">
              <div>
                <h3 className="text-xl font-serif font-black text-hav-forest flex items-center gap-2">
                  <Users className="w-5.5 h-5.5 text-hav-gold" />
                  Client CRM Registry
                </h3>
                <p className="text-xs text-hav-olive opacity-80 mt-1">Total Registered Contacts: {customers.length}</p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hav-brown/40" />
                <input 
                  type="text"
                  value={crmSearch}
                  onChange={e => setCrmSearch(e.target.value)}
                  placeholder="Search clients by name or phone..." 
                  className="w-full bg-hav-cream/30 border border-hav-gold/20 rounded-xl py-2 px-4 pl-9 text-xs font-bold text-hav-olive focus:outline-none focus:ring-2 focus:ring-hav-gold/50"
                />
              </div>
            </div>

            {/* Client table display */}
            <div className="overflow-x-auto rounded-[1.5rem] border border-hav-cream">
              <table className="w-full border-collapse text-left text-xs font-bold text-hav-olive">
                <thead>
                  <tr className="bg-hav-cream/40 text-[9px] font-black uppercase text-hav-forest border-b border-hav-cream">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4 text-center">Mobile Number</th>
                    <th className="p-4 text-center">Balance Due</th>
                    <th className="p-4 text-center">Totals Spent</th>
                    <th className="p-4 text-center">Orders Count</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hav-cream/40">
                  {customers
                    .filter(c => 
                      c.name.toLowerCase().includes(crmSearch.toLowerCase()) || 
                      c.mobile.includes(crmSearch)
                    )
                    .map(cust => {
                      const isExpanded = expandedCustomerId === cust.id;
                      const hasBalance = cust.balance_due > 0;

                      return (
                        <React.Fragment key={cust.id}>
                          <tr className={`hover:bg-hav-cream/5 transition-all text-xs ${isExpanded ? 'bg-hav-cream/10' : ''}`}>
                            <td className="p-4">
                              <span className="text-hav-forest text-sm font-extrabold capitalize">{cust.name}</span>
                              <p className="text-[10px] text-hav-brown font-medium mt-0.5">ID: {cust.id.split('-').pop()?.toUpperCase()}</p>
                            </td>
                            <td className="p-4 text-center">{cust.mobile}</td>
                            <td className={`p-4 text-center font-black ${hasBalance ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ₹{cust.balance_due || 0}
                            </td>
                            <td className="p-4 text-center text-hav-forest font-extrabold">₹{cust.total_spent || 0}</td>
                            <td className="p-4 text-center">{cust.order_count || 0} purchases</td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                                cust.is_store ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                              }`}>
                                {cust.is_store ? 'Whole Seller' : 'Retail Client'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                                className="bg-hav-cream/40 p-2 hover:bg-hav-cream text-hav-olive rounded-lg transition-colors cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Details section row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-6 bg-hav-cream/10 border-b border-hav-cream">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                  {/* Left Panel */}
                                  <div className="bg-white p-5 rounded-2xl border border-hav-gold/15 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-hav-gold tracking-widest">Customer Direct Address</h4>
                                    <p className="text-xs text-hav-forest capitalize font-semibold flex items-start gap-1">
                                      <MapPin className="w-4 h-4 text-hav-gold shrink-0" />
                                      {cust.address || 'No registered delivery location saved.'}
                                    </p>
                                    
                                    <h4 className="text-[10px] font-black uppercase text-hav-gold tracking-widest pt-2">Notes & Remarks</h4>
                                    <p className="text-xs text-hav-brown italic bg-hav-cream/5 p-3 rounded-xl border border-hav-cream">
                                      {cust.notes || 'No custom administrative remarks saved in CRM profile.'}
                                    </p>

                                    <div className="pt-2 flex gap-2">
                                      <button 
                                        onClick={() => handleOpenEditCustomer(cust)}
                                        className="bg-hav-forest text-hav-gold hover:text-hav-forest hover:bg-hav-gold border border-hav-gold/20 font-black py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Edit CRM Info
                                      </button>
                                      
                                      <button 
                                        onClick={() => {
                                          const upiPhone = cust.mobile.replace(/[^\d]/g, '');
                                          window.open(`https://api.whatsapp.com/send?phone=${upiPhone.startsWith('91') ? upiPhone : '91' + upiPhone}&text=Hello%20${cust.name},%20we're%20following%20up%20on%20behalf%20of%20Havikar!%20🌸`, '_blank');
                                        }}
                                        className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-extrabold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                                      >
                                        Message Customer
                                      </button>
                                    </div>
                                  </div>

                                  {/* Right Panel: CRM historic listing invoices */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase text-hav-gold tracking-widest">Client Transaction Logs</h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                      {orders.filter(o => o.customer_id === cust.id).length === 0 ? (
                                        <p className="text-[11px] text-hav-brown/50 italic py-4">No recent receipts recorded.</p>
                                      ) : (
                                        orders.filter(o => o.customer_id === cust.id).map(o => (
                                          <div key={o.id} className="bg-white/80 p-3 rounded-xl border border-hav-cream text-[11px] flex justify-between items-center hover:bg-white transition-all">
                                            <div>
                                              <p className="font-extrabold text-hav-forest">Order #{o.id.split('-').pop()?.toUpperCase()}</p>
                                              <p className="text-[9px] opacity-75">{new Date(o.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-black text-hav-forest">₹{o.total}</p>
                                              <p className="text-[9px] font-black uppercase tracking-wider text-hav-gold">{o.payment_status}</p>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* CRM Edit dialog/modal */}
            {isEditingCustomer && (
              <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] w-full max-w-xl shadow-2xl border border-hav-gold/20 flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-hav-cream">
                    <div>
                      <h4 className="text-lg font-serif font-black text-hav-forest">Edit Customer Profile</h4>
                      <p className="text-[9px] text-hav-gold font-black uppercase tracking-wider mt-0.5">ID: {editedCustData.id}</p>
                    </div>
                    <button onClick={() => setIsEditingCustomer(false)} className="p-1.5 hover:bg-hav-cream rounded-full transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                      <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Customer Name</label>
                      <input 
                        type="text"
                        value={editedCustData.name || ''}
                        onChange={e => setEditedCustData({ ...editedCustData, name: e.target.value })}
                        className="w-full border border-hav-orange-200 rounded-xl p-2.5 text-xs text-hav-brown font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Mobile Contact No</label>
                      <input 
                        type="text"
                        value={editedCustData.mobile || ''}
                        onChange={e => setEditedCustData({ ...editedCustData, mobile: e.target.value })}
                        className="w-full border border-hav-orange-200 rounded-xl p-2.5 text-xs text-hav-brown font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Home/Office Delivery Address</label>
                      <textarea 
                        value={editedCustData.address || ''}
                        onChange={e => setEditedCustData({ ...editedCustData, address: e.target.value })}
                        className="w-full border border-hav-orange-200 rounded-xl p-2.5 text-xs text-hav-brown font-bold focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Store / Wholesale Remarks & Notes</label>
                      <textarea 
                        value={editedCustData.notes || ''}
                        onChange={e => setEditedCustData({ ...editedCustData, notes: e.target.value })}
                        className="w-full border border-hav-orange-200 rounded-xl p-2.5 text-xs text-hav-brown font-bold focus:outline-none resize-none"
                        rows={3}
                        placeholder="Internal store reminders for wholesale patterns..."
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-hav-cream/20 rounded-xl border border-hav-gold/10">
                      <div>
                        <p className="text-xs font-black text-hav-forest">Whole Seller Status</p>
                        <p className="text-[9px] text-hav-brown opacity-80">Enable if customer regularly handles store orders</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditedCustData({ ...editedCustData, is_store: !editedCustData.is_store })}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${editedCustData.is_store ? 'bg-hav-gold' : 'bg-gray-300'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${editedCustData.is_store ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveCustomerEdits}
                    className="w-full mt-6 bg-hav-forest hover:bg-hav-gold text-hav-gold hover:text-hav-forest border border-hav-gold/20 py-3.5 text-center text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Save CRM Profile Modifications
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------- 4. PAGE: PRODUCTS & INVENTORY ADJUST -------------------- */}
        {activeTab === 'inventory_sync' && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-md border border-hav-olive/5 space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-hav-cream">
              <div>
                <h3 className="text-xl font-serif font-black text-hav-forest flex items-center gap-2">
                  <Truck className="w-5.5 h-5.5 text-hav-gold" />
                  Offline Store Stock Dashboard
                </h3>
                <p className="text-xs text-hav-olive opacity-80 mt-1">Realtime inventory levels configuration & syncing</p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hav-brown/40" />
                <input 
                  type="text"
                  value={invSearch}
                  onChange={e => setInvSearch(e.target.value)}
                  placeholder="Search store variants..." 
                  className="w-full bg-hav-cream/30 border border-hav-gold/20 rounded-xl py-2 px-4 pl-9 text-xs font-bold text-hav-olive focus:outline-none"
                />
              </div>
            </div>

            {/* List inventory items */}
            <div className="overflow-x-auto rounded-2xl border border-hav-cream">
              <table className="w-full text-left border-collapse text-xs font-bold text-hav-olive">
                <thead>
                  <tr className="bg-hav-cream/50 text-[10px] font-black uppercase text-hav-forest border-b border-hav-cream">
                    <th className="p-4">Base Product Item</th>
                    <th className="p-4 text-center">Packaging Size</th>
                    <th className="p-4 text-center">Unit Price (₹)</th>
                    <th className="p-4 text-center">Current Stock</th>
                    <th className="p-4 text-center">Sync Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hav-cream/40">
                  {products
                    .filter(p => 
                      p.name.toLowerCase().includes(invSearch.toLowerCase()) ||
                      p.product_variants?.some((pv: any) => pv.net_weight?.toLowerCase().includes(invSearch.toLowerCase()))
                    )
                    .flatMap(prod => {
                      const variants = prod.product_variants || [];
                      return variants.map((pv: any, idx: number) => {
                        const isStockEditing = editingStockId === pv.id;

                        return (
                          <tr key={pv.id} className="hover:bg-hav-cream/5 text-xs font-bold">
                            <td className="p-4">
                              <span className="text-hav-forest font-extrabold text-sm capitalize">{prod.name}</span>
                              <p className="text-[9px] text-hav-gold/80 block uppercase tracking-wider font-semibold mt-0.5">Product ID: {prod.id}</p>
                            </td>
                            <td className="p-4 text-center text-hav-brown text-sm font-black">{pv.net_weight}</td>
                            <td className="p-4 text-center text-hav-forest font-black">₹{pv.price}</td>
                            <td className="p-4 text-center">
                              {isStockEditing ? (
                                <input 
                                  type="number"
                                  value={tempStockValue}
                                  onChange={e => setTempStockValue(e.target.value)}
                                  className="w-20 border border-hav-orange-200 bg-hav-cream/20 text-center rounded-lg p-1.5 focus:outline-none text-xs font-bold"
                                  autoFocus
                                />
                              ) : (
                                <span className={`text-sm font-black px-3.5 py-1 rounded-full ${
                                  (pv.stock_quantity || 0) <= 10 
                                    ? 'bg-rose-100 text-rose-800 animate-pulse' 
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {pv.stock_quantity || 0} units
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {isStockEditing ? (
                                <div className="flex gap-1 justify-center">
                                  <button 
                                    onClick={() => handleSaveStockLocal(prod.id, pv.id)}
                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingStockId(null)}
                                    className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => startEditingStock(pv.id, pv.stock_quantity || 0)}
                                  className="mx-auto bg-hav-forest text-hav-gold hover:text-hav-forest hover:bg-hav-gold border border-hav-gold/20 px-3.5 py-1.5 rounded-xl uppercase text-[9px] tracking-widest font-black transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Adjust
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer footer */}
      <footer className="bg-hav-forest text-hav-cream/60 py-4 px-6 md:px-12 text-center text-[10px] font-black uppercase tracking-widest border-t border-hav-gold/15 flex-shrink-0">
        © 2026 Havikar Stores and POS. All Rights Reserved. Systems fully online.
      </footer>
    </div>
  );
}

// Clock Icon
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
