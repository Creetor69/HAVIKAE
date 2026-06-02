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

const normalizeMobile = (num: string): string => {
  const cleaned = num.replace(/[^\d]/g, '');
  if (cleaned.length === 10 && !cleaned.startsWith('91')) {
    return '91' + cleaned;
  }
  return cleaned || num;
};

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

  // WhatsApp Integration states
  const [whatsappConfig, setWhatsappConfig] = useState<{
    mode: 'browser' | 'cloud_api';
    phoneNumberId: string;
    accessToken: string;
    templateName: string;
    languageCode: string;
    recipientNumbers: string;
    triggerOnNewOrder: boolean;
    supportNumber: string;
  }>(() => {
    const hardcoded = {
      mode: 'cloud_api' as const,
      phoneNumberId: '1066359256570178',
      accessToken: 'EAA3srEndgnwBRuR8l2uyJpNQg61bicvde6X8XZBvZBBfcIvbiJnaH8hKM5oUbzJxxkO5mc3JnoFQvOWKPO53gElRlrshpZCAYb2tZATTjzDLGlZClZBlqtTYCetVsCFXTmIPZBbw3CDrZCMHaKrMSTsWPVec6sUIJbZCiZByhDncRo76B7E89nDDUiAC3tvVZCI5AVZCZCQZDZD',
      templateName: 'hav_order',
      languageCode: 'en',
      recipientNumbers: '',
      triggerOnNewOrder: true,
      supportNumber: '91829692577'
    };

    try {
      const saved = localStorage.getItem('hav_whatsapp_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...hardcoded,
          recipientNumbers: parsed.recipientNumbers || '',
          triggerOnNewOrder: parsed.triggerOnNewOrder ?? true
        };
      }
    } catch (e) {
      console.warn("Could not load WhatsApp config:", e);
    }
    return hardcoded;
  });

  const [showWhatsappSettings, setShowWhatsappSettings] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('hav_whatsapp_config', JSON.stringify(whatsappConfig));
  }, [whatsappConfig]);

  // Admin and Auth Management States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Product adding / onboarding states
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdTagline, setNewProdTagline] = useState<string>('');
  const [newProdDesc, setNewProdDesc] = useState<string>('');
  const [newProdCategoryId, setNewProdCategoryId] = useState<string>('');
  const [newProdSpiceLevel, setNewProdSpiceLevel] = useState<string>('None');
  const [newProdIsVegan, setNewProdIsVegan] = useState<boolean>(false);
  const [newProdIsSponsored, setNewProdIsSponsored] = useState<boolean>(false);
  const [newProdWeight, setNewProdWeight] = useState<string>('');
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdMrp, setNewProdMrp] = useState<number>(0);
  const [newProdStock, setNewProdStock] = useState<number>(0);
  const [newProdAddToWebsite, setNewProdAddToWebsite] = useState<boolean>(true);

  // Additional admin-level fields to exactly mirror the admin panel product modal
  const [newProdGstRate, setNewProdGstRate] = useState<number>(5);
  const [newProdBenefits, setNewProdBenefits] = useState<string>('');
  const [newProdHowToUse, setNewProdHowToUse] = useState<string>('');
  const [newProdIngredients, setNewProdIngredients] = useState<string>('');
  const [newProdMetaTitle, setNewProdMetaTitle] = useState<string>('');
  const [newProdMetaDescription, setNewProdMetaDescription] = useState<string>('');
  const [newProdMetaKeywords, setNewProdMetaKeywords] = useState<string>('');
  const [newProdVideoUrl, setNewProdVideoUrl] = useState<string>('');

  // Partial Payment management states
  const [selectedOrderIdForPayment, setSelectedOrderIdForPayment] = useState<string | null>(null);
  const [tempPaymentAmount, setTempPaymentAmount] = useState<string>('');
  const [partialPaidInput, setPartialPaidInput] = useState<string>('');

  // Notifications / SQL Banner
  const [showSqlGuide, setShowSqlGuide] = useState<boolean>(false);
  const [globalBanner, setGlobalBanner] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);

  // Admin Privilege Session Validation
  useEffect(() => {
    const checkAuthOnStart = async () => {
      setAuthChecking(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile && (profile.is_admin === true || profile.role === 'admin')) {
            setIsAdminLoggedIn(true);
            
            // Auto bind the active staff to the logged-in administrator's name
            let adminName = profile.full_name || profile.name || profile.username || session.user.email?.split('@')[0] || 'Poornima';
            if (adminName && adminName !== 'Poornima') {
              adminName = adminName.charAt(0).toUpperCase() + adminName.slice(1);
            }
            setCurrentStaff(adminName);

            fetchInitialData();
          } else {
            setIsAdminLoggedIn(false);
          }
        } else {
          setIsAdminLoggedIn(false);
        }
      } catch (e) {
        console.warn("Session check failed:", e);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuthOnStart();
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

    // Load Categories
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (catError) throw catError;
      if (catData) {
        setCategories(catData);
      }
    } catch (err: any) {
      console.warn("Categories load failed:", err.message);
      setCategories([
        { id: 'cat-premixes', name: 'Premixes' },
        { id: 'cat-spices', name: 'Spices & Podis' },
        { id: 'cat-sweets', name: 'Sweets & Snacks' }
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
        // User requested: "and in orders dont add orders just keep it blank pls"
        const sampleOrders: OfflineOrder[] = [];
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

  const handleSaveCustomerDetails = async () => {
    if (!customerName.trim()) {
      setGlobalBanner({ type: 'warning', text: "Customer Name is required to save details!" });
      return;
    }
    if (!customerMobile.trim()) {
      setGlobalBanner({ type: 'warning', text: "Customer Mobile number is required!" });
      return;
    }

    const normalizedMobileNum = normalizeMobile(customerMobile);

    try {
      setLoading(true);
      let updatedCusts = [...customers];
      let cid = selectedCustomerId;

      const payloadToUpdate: OfflineCustomer = {
        id: cid || 'cust-' + Math.random().toString(36).substr(2, 8),
        created_at: new Date().toISOString(),
        name: customerName.trim(),
        mobile: normalizedMobileNum,
        address: customerAddress.trim(),
        is_store: isWholesale,
        balance_due: 0,
        total_spent: 0,
        last_order_date: null,
        order_count: 0
      };

      if (cid) {
        // Update existing customer in local array
        const existing = updatedCusts.find(c => c.id === cid);
        if (existing) {
          payloadToUpdate.balance_due = existing.balance_due || 0;
          payloadToUpdate.total_spent = existing.total_spent || 0;
          payloadToUpdate.last_order_date = existing.last_order_date;
          payloadToUpdate.order_count = existing.order_count || 0;
          payloadToUpdate.created_at = existing.created_at;
        }
        updatedCusts = updatedCusts.map(c => c.id === cid ? payloadToUpdate : c);
      } else {
        // Insert new customer if mobile doesn't match an existing one
        const duplicate = updatedCusts.find(c => c.mobile === normalizedMobileNum);
        if (duplicate) {
          cid = duplicate.id;
          payloadToUpdate.balance_due = duplicate.balance_due || 0;
          payloadToUpdate.total_spent = duplicate.total_spent || 0;
          payloadToUpdate.last_order_date = duplicate.last_order_date;
          payloadToUpdate.order_count = duplicate.order_count || 0;
          payloadToUpdate.created_at = duplicate.created_at;
          updatedCusts = updatedCusts.map(c => c.id === cid ? payloadToUpdate : c);
        } else {
          updatedCusts.push(payloadToUpdate);
          cid = payloadToUpdate.id;
        }
      }

      // Sync with Supabase backend (unconditional attempt)
      try {
        const { error } = await supabase.from('offline_customers').upsert(payloadToUpdate);
        if (error) {
          console.error("Supabase Customer Sync failed:", error);
          setGlobalBanner({ 
            type: 'error', 
            text: `Supabase Customer Sync Failed: ${error.message}` 
          });
        }
      } catch (dbErr: any) {
        console.warn("Could not sync customer changes with backend database:", dbErr);
      }

      setCustomers(updatedCusts);
      setSelectedCustomerId(cid);
      setCustomerMobile(normalizedMobileNum);
      setOriginalCustDetails({ mobile: normalizedMobileNum, address: customerAddress.trim() });
      setAskSaveAddress(false);
      setAskSaveMobile(false);
      syncStateToLocal(updatedCusts, orders);
      setGlobalBanner({ type: 'success', text: `Customer details for "${customerName}" successfully saved to CRM!` });
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: `Failed to save customer details: ${err.message}` });
    } finally {
      setLoading(false);
    }
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
      setGlobalBanner({ type: 'warning', text: "Please add at least one product to the Cart!" });
      return;
    }
    if (!customerName.trim()) {
      setGlobalBanner({ type: 'warning', text: "Customer Name is required to place an order!" });
      return;
    }
    if (!customerMobile.trim()) {
      setGlobalBanner({ type: 'warning', text: "Customer Mobile number is required!" });
      return;
    }

    const normalizedMobileNum = normalizeMobile(customerMobile);

    setLoading(true);

    let customerId = selectedCustomerId;
    let updatedCusts = [...customers];

    // Compute preassigned paid and due totals safely
    const parsedPartial = parseFloat(partialPaidInput);
    const resolvedPartialPaid = isNaN(parsedPartial) || parsedPartial < 0 ? finalTotal / 2 : Math.min(finalTotal, parsedPartial);

    const paidAmt = paymentStatus === 'Paid Full' ? finalTotal : (paymentStatus === 'Partial Payment' ? resolvedPartialPaid : 0);
    const balanceDue = finalTotal - paidAmt;

    // If customer is changing details or brand new, handle database update logic
    if (!customerId) {
      // Prompt/Generate brand new offline customer
      const newCust: OfflineCustomer = {
        id: 'cust-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        name: customerName,
        mobile: normalizedMobileNum,
        is_store: isWholesale,
        balance_due: balanceDue,
        total_spent: paidAmt,
        last_order_date: new Date().toISOString(),
        order_count: 1,
        address: customerAddress,
        notes: ''
      };

      // Attempt DB Insert (unconditional attempt)
      try {
        const { error } = await supabase.from('offline_customers').insert(newCust);
        if (error) {
          console.error("Supabase Customer Sync failed:", error);
          setGlobalBanner({ 
            type: 'error', 
            text: `Supabase Customer Sync Failed: ${error.message}` 
          });
        }
      } catch (e: any) {
        console.warn("DB Customer save failed:", e);
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
          total_spent: (customerToUpdate.total_spent || 0) + paidAmt,
          balance_due: (customerToUpdate.balance_due || 0) + balanceDue,
        };

        if (askSaveAddress) {
          payloadToUpdate.address = customerAddress;
        }
        if (askSaveMobile) {
          payloadToUpdate.mobile = normalizedMobileNum;
        }

        // Apply to local state
        updatedCusts = updatedCusts.map(c => c.id === customerId ? { ...c, ...payloadToUpdate } : c);

        // Save to Supabase (unconditional attempt)
        try {
          const { error } = await supabase.from('offline_customers').update(payloadToUpdate).eq('id', customerId);
          if (error) {
            console.error("Supabase Customer Update failed:", error);
            setGlobalBanner({ 
              type: 'error', 
              text: `Supabase Customer Update Failed: ${error.message}` 
            });
          }
        } catch (e: any) {
          console.warn("DB Customer update failed:", e);
        }
      }
    }

    // Build the order record
    const discountVal = overallDiscount;

    const newOrder: OfflineOrder = {
      id: 'ord-' + Math.random().toString(36).substr(2, 8),
      created_at: new Date().toISOString(),
      customer_id: customerId,
      customer_name: customerName,
      customer_mobile: normalizedMobileNum,
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

    setCustomerMobile(normalizedMobileNum);

    const updatedOrders = [newOrder, ...orders];

    // Sync order record directly with Supabase (unconditional attempt)
    try {
      const { error } = await supabase.from('offline_orders').insert(newOrder);
      if (error) {
        console.error("Supabase Order save failed:", error);
        setGlobalBanner({ 
          type: 'error', 
          text: `Supabase Order Sync Failure: ${error.message}. Please check if the 'offline_orders' table is created in Supabase.` 
        });
      } else {
        setGlobalBanner({ type: 'success', text: `Success! Order registered by ${currentStaff} and synced to Supabase backend.` });
      }
    } catch (e: any) {
      console.warn("DB order insert error:", e);
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
    setPartialPaidInput('');
    setAdditionalCharges(0);
    setOrderNotes('');
    setPaymentMethod('Cash');
    setPaymentStatus('Paid Full');
    setFulfillment('Taken in Store');

    setGlobalBanner({
      type: 'success',
      text: `Successfully registered Order #${newOrder.id.split('-')[1].toUpperCase()} by ${currentStaff}!`
    });

    if (whatsappConfig.triggerOnNewOrder) {
      triggerWhatsApp(newOrder, false);
    }

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

    // Sync database with Supabase (unconditional attempt)
    try {
      const { error } = await supabase.from('offline_orders').update({
        payment_status: status,
        amount_paid: nextPaid,
        balance_due: balanceDue
      }).eq('id', orderId);
      if (error) {
        console.error("Supabase Order status update failed:", error);
        setGlobalBanner({ type: 'error', text: `Supabase Sync Fail: ${error.message}` });
      }
    } catch (e) {
      console.warn("Failed database order update:", e);
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

    // Automatic companion message draft trigger when status transitions to Shipped
    const matchingOrder = orders.find(o => o.id === orderId);
    if (matchingOrder && status === 'Shipped') {
      const mobileSanitized = matchingOrder.customer_mobile.replace(/[^\d]/g, '');
      const itemsFormatted = matchingOrder.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
      
      const shipMessage = `Hello ${matchingOrder.customer_name}! 🌸\n\nFantastic news! Your Havikar order #${matchingOrder.id.split('-')[1].toUpperCase()} has been packed and shipped! 🚀📦\n\n📦 *Fulfillment:* Shipped\n🛍️ *Items Dispatched:* ${itemsFormatted}\n\nWe hope these traditional delights bring absolute joy to your home! You can find more of our healthy, premium, and natural range at www.havikar.com.\n\nThank you so much for choosing us! Let us know if you need any adjustments. Have a warm, beautiful day! ✨`;
      
      if (whatsappConfig.mode === 'browser') {
        const encodedText = encodeURIComponent(shipMessage);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${mobileSanitized.startsWith('91') ? mobileSanitized : '91' + mobileSanitized}&text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
        setGlobalBanner({ type: 'success', text: 'Opened WhatsApp shipment dispatch confirmation!' });
      }
    }

    // Sync status change directly to Supabase backend (unconditional attempt)
    try {
      const { error } = await supabase.from('offline_orders').update({ dispatch_status: status }).eq('id', orderId);
      if (error) {
        console.error("Supabase Dispatch update failed:", error);
        setGlobalBanner({ type: 'error', text: `Supabase Sync Fail: ${error.message}` });
      }
    } catch (e) {
      console.warn("Failed database dispatch status update:", e);
    }
  };

  // WhatsApp formatted message generator & trigger
  const triggerWhatsApp = async (order: OfflineOrder, manualTrigger = true) => {
    const mobileSanitized = order.customer_mobile.replace(/[^\d]/g, '');
    
    // Format items with names and clickable links based on name slugs
    const itemsFormatted = order.items.map(item => {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      return `✨ *${item.quantity}x ${item.name} (${item.net_weight})*\n   🔗 www.havikar.com/products/${slug}`;
    }).join('\n\n');

    // Build plain-text items summary with URLs for the template parameter {{3}}
    const itemsSummarySimple = order.items.map(item => {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      return `${item.quantity}x ${item.name} (www.havikar.com/products/${slug})`;
    }).join(', ');
    
    // Check if it's delivery-based to output "Order Placed" vs "Taken in Store"
    const displayFulfillment = order.dispatch_status === 'Taken in Store' ? 'Taken in Store' : 'Order Placed';

    // Format dynamics based on payment status
    const displayPaymentStatus = order.payment_status === 'Paid Full' || order.balance_due <= 0
      ? "Paid securely! 💳 Thank you"
      : `Payment due: ₹${order.balance_due}`;

    const messageText = `Hello ${order.customer_name},\n\nThank you for shopping with Havikar! 🌸 Your order has been successfully placed.\n\n• Order Reference: #${order.id.split('-')[1].toUpperCase()}\n• Total Bill Amount: ₹${order.total}\n• Payment Status: ${displayPaymentStatus}\n\nWe appreciate your association. Have a delicious and wholesome day!`;

    if (whatsappConfig.mode === 'browser') {
      const encodedText = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${mobileSanitized.startsWith('91') ? mobileSanitized : '91' + mobileSanitized}&text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
      if (manualTrigger) {
        setGlobalBanner({ type: 'success', text: 'Opened manual WhatsApp companion chat for bill delivery.' });
      }
    } else {
      // WhatsApp Cloud API Trigger
      const phoneId = whatsappConfig.phoneNumberId.trim();
      const token = whatsappConfig.accessToken.trim();
      if (!phoneId || !token) {
        if (manualTrigger) {
          setGlobalBanner({ type: 'error', text: 'WhatsApp Cloud API triggered but Phone Number ID or Access Token is empty! Please check setup.' });
          setShowWhatsappSettings(true);
        }
        return;
      }

      // Format standard or template call
      const isHelloWorld = whatsappConfig.templateName.trim() === 'hello_world';
      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: mobileSanitized.startsWith('91') || mobileSanitized.length > 10 ? mobileSanitized : '91' + mobileSanitized,
        type: "template",
        template: {
          name: whatsappConfig.templateName.trim(),
          language: {
            code: whatsappConfig.languageCode.trim() || "en"
          }
        }
      };

      // Add template components mapping the 4 ordered Meta template variables
      if (!isHelloWorld) {
        payload.template.components = [
          {
            type: "body",
            parameters: [
              { type: "text", text: order.customer_name }, // {{1}} - Customer Name
              { type: "text", text: order.id.split('-')[1].toUpperCase() }, // {{2}} - Order Number
              { type: "text", text: `₹${order.total}` }, // {{3}} - Total Bill Amount
              { type: "text", text: displayPaymentStatus } // {{4}} - Payment Status
            ]
          }
        ];
      }

      try {
        setLoading(true);
        // Call our Backend CORS API proxy instead of client browser fetch
        const res = await fetch(`/api/offline/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneId,
            token,
            payload
          })
        });

        const data = await res.json();
        if (res.ok) {
          setGlobalBanner({ type: 'success', text: `WhatsApp Cloud API sent message to ${order.customer_name} successfully!` });
        } else {
          console.error("Meta WhatsApp Proxy Error:", data);
          setGlobalBanner({ 
            type: 'error', 
            text: `WhatsApp API Error: ${data?.error?.message || 'Unknown network error. Check console.'}` 
          });
          if (manualTrigger) {
            setShowWhatsappSettings(true);
          }
        }
      } catch (err: any) {
        setGlobalBanner({ type: 'error', text: `Failed to invoke Meta WhatsApp URL: ${err.message}` });
      } finally {
        setLoading(false);
      }
    }
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
    
    const updatedMobile = editedCustData.mobile ? normalizeMobile(editedCustData.mobile) : '';
    const finalEditedCust = { ...editedCustData, ...(updatedMobile ? { mobile: updatedMobile } : {}) };

    const updatedCusts = customers.map(c => 
      c.id === finalEditedCust.id ? { ...c, ...finalEditedCust } : c
    );

    setCustomers(updatedCusts);
    syncStateToLocal(updatedCusts, orders);
    
    // Sync customer updates unconditionally with Supabase
    try {
      const { error } = await supabase
        .from('offline_customers')
        .update({
          name: finalEditedCust.name,
          mobile: finalEditedCust.mobile,
          address: finalEditedCust.address,
          is_store: finalEditedCust.is_store,
          notes: finalEditedCust.notes,
        })
        .eq('id', finalEditedCust.id);
      if (error) {
        console.error("Supabase Customer Edit Sync failed:", error);
        setGlobalBanner({ type: 'error', text: `Supabase CRM Sync Failed: ${error.message}` });
      } else {
        setGlobalBanner({ type: 'success', text: `Customer profile updated & synced to Supabase!` });
      }
    } catch (err: any) {
      alert("Failed to sync customer changes with backend database: " + err.message);
    }

    setIsEditingCustomer(false);
    setGlobalBanner({ type: 'success', text: `Successfully updated customer profile for ${finalEditedCust.name}!` });
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

    // Sync back directly to Supabase product_variants (unconditional attempt)
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock_quantity: nextStock })
        .eq('id', pvId);
        
      if (error) {
        console.error("Supabase Stock sync failed:", error);
        setGlobalBanner({ type: 'error', text: `Supabase Stock Update Failed: ${error.message}` });
      } else {
        setGlobalBanner({ type: 'success', text: `Stock successfully updated in Supabase & Local Cache!` });
      }
    } catch (e: any) {
      alert("Failed to sync stock on Supabase: " + e.message);
    }
  };

  // 1. Admin Authentication Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }
      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profile && (profile.is_admin === true || profile.role === 'admin')) {
          setIsAdminLoggedIn(true);
          // Auto bind the active staff to the logged-in administrator's name
          let adminName = profile.full_name || profile.name || profile.username || data.user.email?.split('@')[0] || 'Poornima';
          if (adminName && adminName !== 'Poornima') {
            adminName = adminName.charAt(0).toUpperCase() + adminName.slice(1);
          }
          setCurrentStaff(adminName);

          fetchInitialData();
          setGlobalBanner({ type: 'success', text: `Access Granted. Logged in as ${adminName}!` });
        } else {
          setAuthError("Access Denied: Only administrative staff are authorized to access the Havikar Offline POS and CRM Register.");
          await supabase.auth.signOut();
        }
      }
    } catch (e: any) {
      setAuthError(e.message || "An unexpected authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Product Onboarding Handler
  const handleOnboardNewProduct = async () => {
    if (!newProdName.trim()) {
      alert("Product Name is required!");
      return;
    }
    if (!newProdWeight.trim()) {
      alert("Net Weight/Packaging is required!");
      return;
    }
    if (newProdPrice <= 0) {
      alert("Offer Price must be greater than 0!");
      return;
    }

    try {
      setLoading(true);
      const generatedProductId = crypto.randomUUID();
      const generatedVariantId = crypto.randomUUID();
      const generatedSlug = newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const newProductRecord: any = {
        id: generatedProductId,
        name: newProdName.trim(),
        tagline: newProdTagline.trim(),
        description: newProdDesc.trim(),
        gst_rate: Number(newProdGstRate || 5),
        image_urls: [],
        is_vegan: newProdIsVegan,
        is_sponsored: newProdIsSponsored,
        spice_level: newProdSpiceLevel,
        category_id: newProdCategoryId || null,
        is_active: true,
        slug: generatedSlug,
        is_offline_only: !newProdAddToWebsite,
        benefits: newProdBenefits.trim(),
        how_to_use: newProdHowToUse.trim(),
        ingredients: newProdIngredients ? newProdIngredients.split('\n').map(x => x.trim()).filter(Boolean) : [],
        meta_title: newProdMetaTitle.trim() || newProdName.trim(),
        meta_description: newProdMetaDescription.trim() || newProdTagline.trim() || newProdName.trim(),
        meta_keywords: newProdMetaKeywords.trim(),
        video_url: newProdVideoUrl.trim() || null
      };

      const newVariantRecord = {
        id: generatedVariantId,
        product_id: generatedProductId,
        net_weight: newProdWeight.trim(),
        price: Number(newProdPrice),
        mrp: Number(newProdMrp || newProdPrice),
        stock_quantity: Number(newProdStock || 0)
      };

      const newLocalRepresentation = {
        ...newProductRecord,
        product_variants: [newVariantRecord]
      };

      const updatedProducts = [newLocalRepresentation, ...products];
      setProducts(updatedProducts);

      let syncedWithDb = false;
      if (dbStatus === 'connected') {
        try {
          const { error: pErr } = await supabase.from('products').insert(newProductRecord);
          if (pErr) throw pErr;

          const { error: vErr } = await supabase.from('product_variants').insert(newVariantRecord);
          if (vErr) throw vErr;

          syncedWithDb = true;
        } catch (dbErr: any) {
          console.error("Failed to insert product in Supabase:", dbErr);
          if (dbErr.message?.includes('is_offline_only')) {
            const { is_offline_only, ...cleanProductRecord } = newProductRecord;
            try {
              await supabase.from('products').insert(cleanProductRecord);
              await supabase.from('product_variants').insert(newVariantRecord);
              syncedWithDb = true;
              setGlobalBanner({ type: 'info', text: "Product added but 'is_offline_only' was omitted. Please run the SQL alter table query from SQL Fix drawer." });
            } catch (retryErr: any) {
              console.error("Retry insert failed:", retryErr);
              alert("Failed to save to online DB: " + retryErr.message);
            }
          } else {
            alert("Failed to save to online DB: " + dbErr.message);
          }
        }
      }

      if (syncedWithDb) {
        setGlobalBanner({ type: 'success', text: `Successfully onboarded product "${newProdName}"! Stock & Online profile synced.` });
      } else {
        setGlobalBanner({ type: 'info', text: `Product "${newProdName}" onboarded locally in offline-safe state. Run SQL Fix to enable complete persistence.` });
      }

      // Reset Form State
      setNewProdName('');
      setNewProdTagline('');
      setNewProdDesc('');
      setNewProdCategoryId('');
      setNewProdSpiceLevel('None');
      setNewProdIsVegan(false);
      setNewProdIsSponsored(false);
      setNewProdWeight('');
      setNewProdPrice(0);
      setNewProdMrp(0);
      setNewProdStock(0);
      setNewProdAddToWebsite(true);
      setNewProdGstRate(5);
      setNewProdBenefits('');
      setNewProdHowToUse('');
      setNewProdIngredients('');
      setNewProdMetaTitle('');
      setNewProdMetaDescription('');
      setNewProdMetaKeywords('');
      setNewProdVideoUrl('');
      setShowAddProductModal(false);

    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: "Error onboarding product: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllOrders = async () => {
    try {
      setLoading(true);
      // Clear Supabase offline_orders
      const { error } = await supabase.from('offline_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.warn("Could not wipe server-side offline_orders:", error);
      }
      // Clear localStorage
      localStorage.removeItem('hav_offline_orders');
      setOrders([]);
      setGlobalBanner({ type: 'success', text: 'All offline orders successfully cleared from active registry.' });
    } catch (err: any) {
      setGlobalBanner({ type: 'error', text: `Failed to completely clear orders: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // 3. Partial Payment Details Re-calculator Handler
  const updateOrderPaymentAmount = async (orderId: string, totalPaid: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (totalPaid < 0) {
      alert("Amount paid cannot be negative!");
      return;
    }

    const oldAmountPaid = order.amount_paid || 0;
    const oldBalanceDue = order.balance_due || 0;

    const finalPaid = Math.min(order.total, totalPaid);
    const balanceDue = order.total - finalPaid;

    let nextStatus: 'Paid Full' | 'Partial Payment' | 'Payment Pending' = 'Payment Pending';
    if (finalPaid >= order.total) {
      nextStatus = 'Paid Full';
    } else if (finalPaid > 0) {
      nextStatus = 'Partial Payment';
    }

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          payment_status: nextStatus,
          amount_paid: finalPaid,
          balance_due: balanceDue
        };
      }
      return o;
    });

    let updatedCustomers = [...customers];
    if (order.customer_id) {
      updatedCustomers = customers.map(c => {
        if (c.id === order.customer_id) {
          const balanceDiff = balanceDue - oldBalanceDue;
          const spentDiff = finalPaid - oldAmountPaid;
          return {
            ...c,
            balance_due: Math.max(0, (c.balance_due || 0) + balanceDiff),
            total_spent: (c.total_spent || 0) + spentDiff
          };
        }
        return c;
      });
    }

    setOrders(updatedOrders);
    setCustomers(updatedCustomers);
    syncStateToLocal(updatedCustomers, updatedOrders);

    // Sync status & customer totals unconditionally to Supabase backend
    try {
      await supabase.from('offline_orders').update({
        payment_status: nextStatus,
        amount_paid: finalPaid,
        balance_due: balanceDue
      }).eq('id', orderId);

      if (order.customer_id) {
        const customerToUpdate = updatedCustomers.find(c => c.id === order.customer_id);
        if (customerToUpdate) {
          await supabase.from('offline_customers').update({
            balance_due: customerToUpdate.balance_due,
            total_spent: customerToUpdate.total_spent
          }).eq('id', order.customer_id);
        }
      }
      setGlobalBanner({ type: 'success', text: `Payment status updated for Order #${orderId.split('-').pop()?.toUpperCase()} & synced to Supabase!` });
    } catch (e: any) {
      console.warn("Database sync error during payment update:", e);
      setGlobalBanner({ type: 'error', text: `Failed to sync payment update to Supabase: ${e.message}` });
    }
    setSelectedOrderIdForPayment(null);
  };

  // SQL Script generator for the user
  const SQL_UPDATE_COMMANDS = `-- EXECUTE THIS IN YOUR SUPABASE SQL EDITOR TO SETUP OFFLINE POS SCHEMAS AND ADMIN ROLES:

-- ==========================================
-- 1. UPGRADE EXISTING TABLES (MIGRATIONS)
-- Run these first to fix missing column errors!
-- ==========================================
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS is_store BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS balance_due REAL DEFAULT 0.0;
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS total_spent REAL DEFAULT 0.0;
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS offline_customers ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS offline_orders ADD COLUMN IF NOT EXISTS additional REAL DEFAULT 0.0;
ALTER TABLE IF EXISTS offline_orders ADD COLUMN IF NOT EXISTS amount_paid REAL DEFAULT 0.0;
ALTER TABLE IF EXISTS offline_orders ADD COLUMN IF NOT EXISTS balance_due REAL DEFAULT 0.0;
ALTER TABLE IF EXISTS offline_orders ADD COLUMN IF NOT EXISTS staff_name TEXT DEFAULT 'Poornima';

-- ==========================================
-- 2. CREATE SCHEMAS FROM SCRATCH IF MISSING
-- ==========================================

-- Create Offline Customers Table
CREATE TABLE IF NOT EXISTS offline_customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    is_store BOOLEAN DEFAULT false,
    balance_due REAL DEFAULT 0.0,
    total_spent REAL DEFAULT 0.0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    order_count INTEGER DEFAULT 0,
    notes TEXT,
    address TEXT
);

-- Create Offline Orders Table
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

-- 3. Update Profiles Schema to fully authorize Admins
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';

-- 4. Update core Products Table with Onboarding Attributes & Offline Catalog Columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offline_only BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS how_to_use TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- 5. Enable Row Level Security (RLS) & Policies for offline operations
ALTER TABLE offline_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write offline customers" ON offline_customers;
DROP POLICY IF EXISTS "Allow public read/write offline orders" ON offline_orders;

CREATE POLICY "Allow public read/write offline customers" ON offline_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write offline orders" ON offline_orders FOR ALL USING (true) WITH CHECK (true);
`;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-hav-cream flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-10 h-10 text-hav-forest animate-spin mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-hav-olive">Checking Administrator Session...</span>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-hav-cream flex items-center justify-center px-4 font-sans select-none selection:bg-hav-gold/30">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-hav-gold/15 shadow-2xl w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-hav-forest text-hav-gold flex items-center justify-center rounded-3xl mx-auto mb-4 border border-hav-gold/20 font-black text-xl">
              🔑
            </div>
            <h2 className="text-2xl font-serif font-black text-hav-forest">Havikar POS Register</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Administrative Authorization Required</p>
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-150 p-4 rounded-2xl text-rose-700 text-xs font-semibold leading-relaxed">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Admin Email Address</label>
              <input 
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@havikar.com"
                className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-bold text-hav-brown focus:outline-none focus:ring-2 focus:ring-hav-gold/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-hav-gold block mb-1">Secure Password</label>
              <input 
                type="password"
                required
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-bold text-hav-brown focus:outline-none focus:ring-2 focus:ring-hav-gold/50"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-hav-forest text-hav-gold hover:text-hav-forest hover:bg-hav-gold border border-hav-gold/30 disabled:bg-gray-400 disabled:text-gray-200 disabled:border-none font-black py-3.5 px-8 rounded-xl tracking-widest uppercase text-xs cursor-pointer shadow-xl transition-all flex justify-center items-center gap-2"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Authorize and Enter POS"
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-hav-olive opacity-80 mt-4 leading-normal">
            Only admin profiles with the <code>is_admin</code> attribute flag active are allowed to manage sales registries and CRM catalogs. Contact Ananth if you need administrator clearance.
          </p>
        </div>
      </div>
    );
  }

  const selectedOrderForPayment = orders.find(o => o.id === selectedOrderIdForPayment);

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
          {/* Staff selection (Static showing active admin name, no dropdown) */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase text-white/50 tracking-wider">Active Staff:</span>
            <span className="text-sm font-serif font-black text-hav-gold leading-none">{currentStaff}</span>
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

          {/* Database Offline indicators */}

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

                  {/* Save Customer Details button */}
                  <div className="pt-3 border-t border-hav-cream flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCustomerDetails}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-hav-gold hover:bg-hav-forest text-hav-forest hover:text-hav-gold font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm border border-hav-gold/25"
                    >
                      <Save className="w-4 h-4" />
                      Save Customer Details
                    </button>
                    {(customerName || customerMobile || customerAddress || selectedCustomerId) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerName('');
                          setCustomerMobile('');
                          setCustomerAddress('');
                          setSelectedCustomerId('');
                          setIsWholesale(false);
                          setOriginalCustDetails(null);
                          setAskSaveAddress(false);
                          setAskSaveMobile(false);
                          setGlobalBanner({ type: 'success', text: "Customer fields cleared." });
                        }}
                        className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-red-200"
                        title="Clear customer fields"
                      >
                        Clear
                      </button>
                    )}
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

                  {paymentStatus === 'Partial Payment' && (
                    <div className="mt-3 p-3 bg-orange-50/50 rounded-xl border border-orange-200/50 animate-fadeIn">
                      <label className="text-[9px] font-black uppercase text-orange-850 block mb-1">Amount Paid Now (₹)</label>
                      <input 
                        type="number"
                        value={partialPaidInput}
                        onChange={e => setPartialPaidInput(e.target.value)}
                        placeholder="Default is half of grand total"
                        className="w-full bg-white border border-orange-200 rounded-lg py-1.5 px-3 text-xs text-hav-brown font-bold focus:outline-none focus:ring-1 focus:ring-orange-300"
                      />
                    </div>
                  )}
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

                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllOrders}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm md:ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Flush Queue
                  </button>
                )}
              </div>
            </div>

            {/* List of queue orders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQueueOrders.length === 0 ? (
                <div className="col-span-full bg-white p-12 py-16 rounded-[2.5rem] text-center border border-hav-olive/10 shadow-md space-y-4 max-w-lg mx-auto my-6 animate-fadeIn">
                  <div className="w-16 h-16 bg-hav-cream text-hav-gold rounded-full flex items-center justify-center text-3xl mx-auto border border-hav-gold/15 shadow-sm">
                    📭
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-hav-forest">No Orders in Active Registry</h3>
                    <p className="text-xs text-hav-olive mt-1 max-w-sm mx-auto leading-relaxed">
                      There are currently no active orders matching this filter in the POS queue. Hit the button below or use "New Sale" tab to start a transaction.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('new_sale')}
                    className="px-6 py-2 bg-hav-forest hover:bg-hav-gold text-hav-gold hover:text-hav-forest border border-hav-gold/20 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-block shadow-sm"
                  >
                    ➕ Start New Sale
                  </button>
                </div>
              ) : (
                filteredQueueOrders.map((order) => {
                  const itemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  const isDelivered = order.dispatch_status === 'Delivered';
                  const isShipped = order.dispatch_status === 'Shipped';
                  const isPartialPayment = order.payment_status === 'Partial Payment';
                  const isPendingPayment = order.payment_status === 'Payment Pending' || isPartialPayment;

                  return (
                    <div 
                      key={order.id} 
                      onClick={() => {
                        setSelectedOrderIdForPayment(order.id);
                        setTempPaymentAmount(order.amount_paid.toString());
                      }}
                      className={`bg-white rounded-[2rem] p-6 shadow-md border flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:scale-[1.01] cursor-pointer ${
                        order.dispatch_status === 'Cancelled' ? 'border-red-100 opacity-60' :
                        isDelivered ? 'border-emerald-100 bg-emerald-50/5' : 
                        isPartialPayment ? 'border-orange-400 bg-amber-50/30 ring-4 ring-orange-300/15' : 'border-hav-gold/20'
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
                            {order.payment_method} • {isPartialPayment ? 'Payment Pending' : order.payment_status}
                          </span>
                          <div className="text-right">
                            <span className="text-base font-black text-hav-forest block">
                              ₹{order.total}
                            </span>
                            {isPartialPayment && (
                              <span className="text-[9px] text-neutral-500 block">
                                (Paid: ₹{order.amount_paid} | Due: ₹{order.balance_due})
                              </span>
                            )}
                          </div>
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
                            isPartialPayment ? 'bg-orange-100 text-orange-900 border border-orange-250 animate-pulse font-black ring-2 ring-orange-200/50' : 'bg-red-100 text-red-800'
                          }`}>
                            💰 {isPartialPayment ? 'Payment Pending' : order.payment_status}
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
                                onClick={(e) => { e.stopPropagation(); updateOrderPaymentStatus(order.id, 'Paid Full'); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-2.5 px-1.5 rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                              >
                                Paid Full
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Shipped'); }}
                                className="bg-hav-cream/60 hover:bg-hav-cream text-hav-forest text-[9px] font-black py-2.5 px-1.5 rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                              >
                                Unmark Delivered
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Cancelled'); }}
                                className="col-span-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-black py-2 px-1.5 rounded-xl uppercase tracking-wider transition-colors border border-rose-150 cursor-pointer"
                              >
                                Return/Refund Item
                              </button>
                            </>
                          ) : isShipped ? (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); triggerWhatsApp(order); }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Send Message
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Taken in Store'); }}
                                className="bg-hav-cream hover:bg-hav-cream/80 text-hav-forest text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              >
                                Unmark Shipped
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Delivered'); }}
                                className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2.5 px-1.5 rounded-xl uppercase tracking-widest transition-colors shadow-md cursor-pointer"
                              >
                                Mark Delivered
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); alert("Marked delivery problem! Flagged for staff review."); }}
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-[8px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all border border-yellow-250 cursor-pointer"
                              >
                                Mark Problem
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Cancelled'); }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 text-[8px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all border border-red-150 cursor-pointer"
                              >
                                Cancel Order
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderPaymentStatus(order.id, 'Paid Full'); }}
                                className="col-span-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[9px] font-black py-2 px-1 text-center rounded-xl uppercase tracking-widest transition-all border border-teal-150 cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            </>
                          ) : (
                            // Draft or Taken in Store
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Shipped'); }}
                                className="bg-hav-forest text-hav-gold hover:bg-hav-forest/90 text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              >
                                Dispatch Order
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateOrderDispatchStatus(order.id, 'Delivered'); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              >
                                Direct Handover
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); triggerWhatsApp(order); }}
                                className="col-span-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-black py-2 px-1 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-3 h-3 text-emerald-800" />
                                WhatsApp Bill details
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const supportNum = (whatsappConfig.supportNumber || '91829692577').replace(/[^\d]/g, '');
                              const ref = order.id.split('-').pop()?.toUpperCase();
                              const text = encodeURIComponent(`Hello! I need support with Order #${ref} for customer ${order.customer_name}. Please assist.`);
                              window.open(`https://api.whatsapp.com/send?phone=${supportNum}&text=${text}`, '_blank');
                            }}
                            className="col-span-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-500/20 text-[9px] font-black py-2 px-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs mt-1"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-600" />
                            💬 Contact Support WhatsApp (829692577)
                          </button>
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

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="bg-hav-forest text-hav-gold hover:text-hav-forest hover:bg-hav-gold border border-hav-gold/30 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  ➕ Onboard Product
                </button>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hav-brown/40" />
                  <input 
                    type="text"
                    value={invSearch}
                    onChange={e => setInvSearch(e.target.value)}
                    placeholder="Search store variants..." 
                    className="w-full bg-hav-cream/30 border border-hav-gold/20 rounded-xl py-2.5 px-4 pl-9 text-xs font-bold text-hav-olive focus:outline-none focus:ring-2 focus:ring-hav-gold/55"
                  />
                </div>
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

      {/* Onboard Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-hav-gold/20 animate-scaleUp">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <div>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">Product Onboarding (POS)</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Register a new product to store catalog</p>
              </div>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="p-2 hover:bg-hav-cream rounded-full transition-colors text-hav-olive"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 md:pr-4 flex-grow custom-scrollbar">
              {/* Left Column: General Info and Attributes */}
              <div className="space-y-6">
                <section className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">General Information</h4>
                  <div className="space-y-4">
                    <input 
                      value={newProdName} 
                      onChange={e => setNewProdName(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="Product Name (e.g. Sambar Powder)" 
                    />
                    <input 
                      value={newProdTagline} 
                      onChange={e => setNewProdTagline(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="Short Tagline (e.g. Authentic Brahmin Flavor)" 
                    />
                    <textarea 
                      value={newProdDesc} 
                      onChange={e => setNewProdDesc(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="Full description of the item..." 
                      rows={3} 
                    />
                  </div>
                </section>

                <section className="bg-hav-forest/5 p-6 rounded-3xl border border-hav-forest/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Category & Attributes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={newProdCategoryId} 
                      onChange={e => setNewProdCategoryId(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-olive focus:outline-none focus:ring-1 focus:ring-hav-gold/40"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select 
                      value={newProdSpiceLevel} 
                      onChange={e => setNewProdSpiceLevel(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-olive focus:outline-none focus:ring-1 focus:ring-hav-gold/40"
                    >
                      <option value="None">No Spice</option>
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Hot">Hot</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">GST Tax Rate (%)</label>
                      <select 
                        value={newProdGstRate} 
                        onChange={e => setNewProdGstRate(Number(e.target.value))} 
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-xs font-black text-hav-olive focus:outline-none focus:ring-1 focus:ring-hav-gold/40"
                      >
                        <option value={5}>5% (Standard Spices)</option>
                        <option value={12}>12% (Processed Foods)</option>
                        <option value={18}>18% (Premium Content)</option>
                        <option value={0}>0% (Exempt)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-hav-olive">
                        <input 
                          type="checkbox" 
                          checked={newProdIsVegan} 
                          onChange={e => setNewProdIsVegan(e.target.checked)} 
                          className="rounded text-hav-forest accent-hav-forest w-4 h-4 cursor-pointer"
                        />
                        Is Vegan 🌱
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-hav-olive">
                        <input 
                          type="checkbox" 
                          checked={newProdIsSponsored} 
                          onChange={e => setNewProdIsSponsored(e.target.checked)} 
                          className="rounded text-hav-forest accent-hav-forest w-4 h-4 cursor-pointer"
                        />
                        Staff Favorite ⭐
                      </label>
                    </div>
                  </div>
                </section>

                <section className="bg-hav-orange-50/50 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Initial Variant & Sizing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-forest block mb-1">Packing (Weight/Qty)</label>
                      <input 
                        value={newProdWeight} 
                        onChange={e => setNewProdWeight(e.target.value)} 
                        className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-3 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                        placeholder="e.g. 250g or 10 packets" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-forest block mb-1">Store Offer Price (₹)</label>
                      <input 
                        type="number" 
                        value={newProdPrice || ''} 
                        onChange={e => setNewProdPrice(Number(e.target.value))} 
                        className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-3 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                        placeholder="e.g. 280" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-forest block mb-1">MRP Price (₹)</label>
                      <input 
                        type="number" 
                        value={newProdMrp || ''} 
                        onChange={e => setNewProdMrp(Number(e.target.value))} 
                        className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-3 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                        placeholder="e.g. 300" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-forest block mb-1">Initial Stock Quantity</label>
                      <input 
                        type="number" 
                        value={newProdStock || ''} 
                        onChange={e => setNewProdStock(Number(e.target.value))} 
                        className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-3 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                        placeholder="e.g. 50" 
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: SEO Metadata and Extra Details */}
              <div className="space-y-6">
                <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">SEO & Meta Data</h4>
                  <div className="space-y-4">
                    <input 
                      value={newProdMetaTitle} 
                      onChange={e => setNewProdMetaTitle(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="SEO Meta Title (defaults to product name)" 
                    />
                    <textarea 
                      value={newProdMetaDescription} 
                      onChange={e => setNewProdMetaDescription(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="SEO Meta Description" 
                      rows={2} 
                    />
                    <input 
                      value={newProdMetaKeywords} 
                      onChange={e => setNewProdMetaKeywords(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="SEO Meta Keywords (comma separated)" 
                    />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Content & Marketing Details</h4>
                  <div className="space-y-4">
                    <input 
                      value={newProdVideoUrl} 
                      onChange={e => setNewProdVideoUrl(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="Video URL (YouTube/Vimeo)" 
                    />
                    <textarea 
                      value={newProdBenefits} 
                      onChange={e => setNewProdBenefits(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="Benefits (one per line)" 
                      rows={2} 
                    />
                    <textarea 
                      value={newProdHowToUse} 
                      onChange={e => setNewProdHowToUse(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="How to Use instruction guidelines" 
                      rows={2} 
                    />
                    <textarea 
                      value={newProdIngredients} 
                      onChange={e => setNewProdIngredients(e.target.value)} 
                      className="w-full border border-hav-orange-200 rounded-xl py-2.5 px-4 bg-white text-xs font-black text-hav-brown focus:outline-none focus:ring-1 focus:ring-hav-gold/40 placeholder:text-gray-400" 
                      placeholder="Ingredients listing (one per line)" 
                      rows={2} 
                    />
                  </div>
                </section>

                {/* Checkbox requested specifically: ask whether to add to website */}
                <div className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-hav-gold tracking-widest">Store Publishing Clearance</h4>
                  <div className="p-4 bg-hav-cream/20 rounded-2xl border border-hav-orange-100 flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="addToWebsiteCheckbox"
                      checked={newProdAddToWebsite} 
                      onChange={e => setNewProdAddToWebsite(e.target.checked)} 
                      className="w-5 h-5 rounded text-hav-forest accent-hav-forest border-hav-orange-200 shrink-0 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="addToWebsiteCheckbox" className="text-xs cursor-pointer select-none">
                      <strong className="text-hav-forest font-black block text-[13px]">Publish to Online Store Website?</strong>
                      <span className="text-[10px] text-hav-olive opacity-85 leading-relaxed mt-1 block">
                        If checked, this works exactly like the website's admin panel, automatically updating the storefront. If unchecked, the item is local to offline register only!
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-hav-gold/10 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full font-black text-xs text-gray-400 uppercase tracking-widest transition-all cursor-pointer"
              >
                Discard
              </button>
              <button 
                onClick={handleOnboardNewProduct}
                className="px-6 py-2.5 bg-hav-forest hover:bg-hav-gold text-hav-gold hover:text-hav-forest border border-hav-gold/30 rounded-full font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md"
              >
                Onboard & Register Pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-hav-gold/20 animate-scaleUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-serif font-black text-hav-forest flex items-center gap-2">
                💸 Update Order Payment
              </h3>
              <button 
                onClick={() => setSelectedOrderIdForPayment(null)} 
                className="p-1.5 hover:bg-hav-cream rounded-full transition-colors text-hav-olive"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-hav-cream/30 rounded-2xl border border-hav-gold/10 space-y-1.5 text-xs text-hav-olive">
                <p className="flex justify-between"><span className="opacity-80">Reference Code:</span> <strong className="font-mono text-hav-forest">#{selectedOrderForPayment.id.split('-').pop()?.toUpperCase()}</strong></p>
                <p className="flex justify-between"><span className="opacity-80">Customer:</span> <strong className="capitalize">{selectedOrderForPayment.customer_name}</strong></p>
                <div className="h-px bg-hav-orange-200/40 my-2" />
                <p className="flex justify-between text-xs"><span className="opacity-80">Grand Total:</span> <strong className="text-hav-forest">₹{selectedOrderForPayment.total}</strong></p>
                <p className="flex justify-between text-xs"><span className="opacity-80">Current Amount Paid:</span> <strong className="text-emerald-800">₹{selectedOrderForPayment.amount_paid}</strong></p>
                <p className="flex justify-between text-xs"><span className="opacity-80">Balance Due:</span> <strong className="text-rose-800 font-extrabold">₹{selectedOrderForPayment.balance_due}</strong></p>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-hav-gold block mb-1.5 font-sans tracking-wide">Enter Cumulative Amount Paid (₹)</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="number"
                    value={tempPaymentAmount}
                    onChange={e => setTempPaymentAmount(e.target.value)}
                    className="flex-grow border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-xs text-hav-brown font-bold focus:outline-none focus:ring-2 focus:ring-hav-gold/50"
                    placeholder="e.g. 500"
                  />
                  {selectedOrderForPayment.balance_due > 0 && (
                    <button
                      type="button"
                      onClick={() => setTempPaymentAmount(selectedOrderForPayment.total.toString())}
                      className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                    >
                      ⚡ Clear All
                    </button>
                  )}
                </div>
                {selectedOrderForPayment.balance_due > 0 && (
                  <p className="text-[10px] bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-100 font-extrabold flex justify-between items-center animate-fadeIn my-2.5">
                    <span>Outstanding Due: ₹{selectedOrderForPayment.balance_due}</span>
                    <button
                      type="button"
                      onClick={() => setTempPaymentAmount(selectedOrderForPayment.total.toString())}
                      className="underline text-[9px] uppercase tracking-wider hover:opacity-85"
                    >
                      Fill ₹{selectedOrderForPayment.total}
                    </button>
                  </p>
                )}
                <p className="text-[9px] text-hav-olive opacity-85 mt-2 leading-relaxed">
                  If this amount is equal to or greater than ₹{selectedOrderForPayment.total}, payment transitions to <strong>Paid Full</strong>. If smaller, it becomes <strong>Partial Payment</strong> (shown as 'Payment Pending').
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setSelectedOrderIdForPayment(null)}
                className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl font-black text-[10px] text-gray-500 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => updateOrderPaymentAmount(selectedOrderForPayment.id, Number(tempPaymentAmount || 0))}
                className="flex-1 py-2.5 bg-hav-forest hover:bg-hav-gold text-hav-gold hover:text-hav-forest border border-hav-gold/25 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md cursor-pointer"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Configuration and Automation Hub modal */}
      {showWhatsappSettings && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col border border-hav-gold/20 animate-scaleUp">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-serif font-black text-hav-forest flex items-center gap-2">
                  <span>💬 WhatsApp Integration & CRM Settings</span>
                </h3>
                <p className="text-[10px] uppercase font-black text-hav-gold mt-1 tracking-widest">Configure direct web redirects or Meta WhatsApp Cloud API triggers</p>
              </div>
              <button 
                onClick={() => setShowWhatsappSettings(false)} 
                className="p-1.5 hover:bg-hav-cream rounded-full transition-colors text-hav-olive"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {/* Selector */}
              <div className="bg-hav-cream/30 p-4 rounded-2xl border border-hav-gold/10">
                <label className="text-[10px] font-black uppercase text-hav-forest block mb-2 tracking-wider">Select Dispatch Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setWhatsappConfig(prev => ({ ...prev, mode: 'browser' }))}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      whatsappConfig.mode === 'browser' 
                        ? 'bg-hav-forest text-hav-gold border-hav-forest shadow-md' 
                        : 'bg-white hover:bg-gray-50 text-hav-olive border-gray-200'
                    }`}
                  >
                    Direct Web Link (Manual)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setWhatsappConfig(prev => ({ ...prev, mode: 'cloud_api' }))}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      whatsappConfig.mode === 'cloud_api' 
                        ? 'bg-hav-forest text-hav-gold border-hav-forest shadow-md' 
                        : 'bg-white hover:bg-gray-50 text-hav-olive border-gray-200'
                    }`}
                  >
                    WhatsApp Cloud API (Automated)
                  </button>
                </div>
                <p className="text-[10px] text-hav-olive mt-2 opacity-85 leading-relaxed">
                  {whatsappConfig.mode === 'browser' 
                    ? "✓ Standard mode. Pre-compiles full bill details, invoice price and item list and opens standard WhatsApp Web page with the pre-filled message, allowing manual click-to-send without any tokens or setup."
                    : "⚡ Highly advanced serverless automation. Fires directly from POS browser to Facebook Graph API. Perfect for test flow alerts or automated customer outreach."
                  }
                </p>
              </div>

              {/* Automation Toggle */}
              <div className="bg-white p-4 rounded-2xl border border-hav-gold/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-hav-forest uppercase tracking-wider">Autosend Bill on Checkout</h4>
                  <p className="text-[10px] text-hav-olive opacity-80 mt-0.5">Automatically trigger message on completing order checkout register</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsappConfig(prev => ({ ...prev, triggerOnNewOrder: !prev.triggerOnNewOrder }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${whatsappConfig.triggerOnNewOrder ? 'bg-hav-gold' : 'bg-gray-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${whatsappConfig.triggerOnNewOrder ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {whatsappConfig.mode === 'cloud_api' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* METABOX: Ultimate Meta WhatsApp API Troubleshooting Helper */}
                  <div className="bg-sky-50 text-sky-950 border border-sky-200 rounded-2xl p-4 text-[11px] leading-relaxed w-full">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="font-extrabold uppercase tracking-wide block text-sky-900">🛠️ Meta Studio Developer Credentials:</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setWhatsappConfig({
                            mode: 'cloud_api',
                            phoneNumberId: '1066359256570178',
                            accessToken: 'EAA3srEndgnwBRuR8l2uyJpNQg61bicvde6X8XZBvZBBfcIvbiJnaH8hKM5oUbzJxxkO5mc3JnoFQvOWKPO53gElRlrshpZCAYb2tZATTjzDLGlZClZBlqtTYCetVsCFXTmIPZBbw3CDrZCMHaKrMSTsWPVec6sUIJbZCiZByhDncRo76B7E89nDDUiAC3tvVZCI5AVZCZCQZDZD',
                            templateName: 'hav_order',
                            languageCode: 'en',
                            recipientNumbers: whatsappConfig.recipientNumbers,
                            triggerOnNewOrder: true,
                            supportNumber: '91829692577'
                          });
                          setGlobalBanner({ type: 'success', text: 'Official Havikar WhatsApp API keys successfully loaded!' });
                        }}
                        className="px-2 py-1 bg-sky-900 text-sky-100 text-[9px] font-black uppercase tracking-wider rounded border border-sky-700 hover:bg-sky-950 hover:text-white transition-colors"
                      >
                        🔄 Restore Official Credentials
                      </button>
                    </div>
                    
                    <div className="space-y-3 font-medium text-sky-850">
                      <div>
                        <span className="font-black text-rose-700 uppercase">1. Sending to any/all customer numbers:</span>
                        <p className="mt-0.5">While your Meta App remains in <strong>Sandbox Mode (Development)</strong> with a test phone number (+1 555-xxx-xxxx), Meta strictly limits delivery <strong>ONLY to whitelisted Sandbox Testers</strong> (the To number you registered in their panel). To send messages to all customers, you must complete <strong>Step 5 (Add a phone number)</strong> in your Meta panel to link & verify your permanent live phone number, and complete <strong>Step 6</strong> (Set up a payment method) to lift the sandbox restrictions.</p>
                      </div>

                      <div className="h-px bg-sky-200" />

                      <div>
                        <span className="font-black text-rose-700 uppercase">2. Fixing Rejection: "Template does not exist" (#132001):</span>
                        <p className="mt-0.5">Meta requires message templates to be reviewed and pre-approved. Your template name <code>hav_order</code> doesn't exist yet on your Meta Business Account under English (en/en_US). To resolve this:</p>
                        <ul className="list-disc list-inside mt-1 ml-1 space-y-1 text-[10px]">
                          <li>Either change the template name below to <strong><code>hello_world</code></strong> (which is pre-approved for all test accounts by Meta with language <strong><code>en_US</code></strong> or <strong><code>en</code></strong>).</li>
                          <li>Or go to Meta Developer Dashboard &rarr; <strong>WhatsApp Manager</strong> &rarr; <strong>Message Templates</strong>, create a new template named <strong><code>hav_order</code></strong> with language <strong><code>en</code></strong>, define the variables, and wait for Facebook to approve it.</li>
                        </ul>
                      </div>

                      <div className="h-px bg-sky-200" />

                      <div>
                        <span className="font-black text-emerald-700 uppercase">3. Prevent Daily Expiration (Get a Permanent Token):</span>
                        <p className="mt-0.5">To prevent your access token from expiring every 24 hours, you need to generate a <strong>Permanent System User Access Token</strong> through Meta Business Manager:</p>
                        <ol className="list-decimal list-inside mt-1 ml-1 space-y-1 text-[10px]">
                          <li>Go to your <strong>Meta Business Suite Settings</strong> (business.facebook.com/settings).</li>
                          <li>Go to <strong>Users &rarr; System Users</strong>. Add a new System User (choose role <em>"Admin"</em>).</li>
                          <li>Click on your System User, click <strong>Add Assets</strong>, choose <strong>Apps</strong> &rarr; select your WhatsApp app, and enable **Full Control**. Save changes.</li>
                          <li>Under the same System User, click <strong>Generate New Token</strong>. Select your WhatsApp App.</li>
                          <li>Check the <strong>whatsapp_business_messaging</strong> and <strong>whatsapp_business_management</strong> scopes.</li>
                          <li>Click <strong>Generate Token</strong>. Copy this permanent token and paste it below! It will <strong>never expire</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">WhatsApp Phone Number ID</label>
                      <input 
                        type="text"
                        value={whatsappConfig.phoneNumberId}
                        onChange={e => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 text-xs text-hav-brown font-mono focus:outline-none focus:ring-2 focus:ring-hav-gold/40"
                        placeholder="e.g. 106341278xxxxxx"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">Language Code (Locale)</label>
                      <input 
                        type="text"
                        value={whatsappConfig.languageCode}
                        onChange={e => setWhatsappConfig(prev => ({ ...prev, languageCode: e.target.value }))}
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 text-xs text-hav-brown font-mono focus:outline-none focus:ring-2 focus:ring-hav-gold/40"
                        placeholder="e.g. en_US"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">WhatsApp Cloud API Permanent Access Token</label>
                    <input 
                      type="password"
                      value={whatsappConfig.accessToken}
                      onChange={e => setWhatsappConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 text-xs font-mono text-hav-brown bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-hav-gold/40"
                      placeholder="Paste EAAB... Meta App Token"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">Official Message Template Name</label>
                      <input 
                        type="text"
                        value={whatsappConfig.templateName}
                        onChange={e => setWhatsappConfig(prev => ({ ...prev, templateName: e.target.value }))}
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 text-xs text-hav-brown font-mono focus:outline-none focus:ring-2 focus:ring-hav-gold/40"
                        placeholder="e.g. hello_world"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">Sandbox Tester Recipients</label>
                      <input 
                        type="text"
                        value={whatsappConfig.recipientNumbers}
                        onChange={e => setWhatsappConfig(prev => ({ ...prev, recipientNumbers: e.target.value }))}
                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 text-xs text-hav-brown focus:outline-none focus:ring-2 focus:ring-hav-gold/40 placeholder:text-gray-400"
                        placeholder="e.g. +91 702xx xxxxx (Comma separated)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-hav-gold block mb-1">Dedicated Customer Support WhatsApp Hotline (e.g. for customer support redirects)</label>
                    <input 
                      type="text"
                      value={whatsappConfig.supportNumber}
                      onChange={e => setWhatsappConfig(prev => ({ ...prev, supportNumber: e.target.value }))}
                      className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 text-xs text-hav-brown font-mono focus:outline-none focus:ring-2 focus:ring-hav-gold/40"
                      placeholder="e.g. 91829692577"
                    />
                  </div>

                  <div className="h-px bg-hav-cream my-2" />

                  {/* Sandbox Tester Trigger */}
                  <div className="bg-hav-forest/5 p-4 rounded-2xl border border-hav-gold/15">
                    <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-wider mb-2">⚡ Sandbox Signal Test-flight</h4>
                    <p className="text-[9px] text-hav-olive mb-3">Fire a template confirmation payload to your test number to check communication tunnels.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const tester = whatsappConfig.recipientNumbers.split(',')[0]?.replace(/[^\d]/g, '');
                          if (!tester || !whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
                            setGlobalBanner({ type: 'warning' as any, text: 'To perform this test, enter Phone Number ID, Access Token, and Sandbox Tester Number!' });
                            return;
                          }
                          try {
                            setLoading(true);

                            const isHelloWorld = (whatsappConfig.templateName || "hello_world").trim() === 'hello_world';
                            let payload: any = {
                              messaging_product: "whatsapp",
                              recipient_type: "individual",
                              to: tester.startsWith('91') || tester.length > 10 ? tester : '91' + tester,
                              type: "template",
                              template: {
                                name: (whatsappConfig.templateName || "hello_world").trim(),
                                language: { code: (whatsappConfig.languageCode || "en").trim() }
                              }
                            };
                            if (!isHelloWorld) {
                              payload.template.components = [
                                {
                                  type: "body",
                                  parameters: [
                                    { type: "text", text: "Verified Tester" }, // {{1}} - Customer Name
                                    { type: "text", text: "SANDBOX123" }, // {{2}} - Order Number
                                    { type: "text", text: "₹999" }, // {{3}} - Total Bill Amount
                                    { type: "text", text: "Paid securely! 💳 Thank you" } // {{4}} - Payment Status
                                  ]
                                }
                              ];
                            }

                            // Call backend API proxy to completely bypass browser CORS block
                            const res = await fetch(`/api/offline/send-whatsapp`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                phoneId: whatsappConfig.phoneNumberId,
                                token: whatsappConfig.accessToken,
                                payload
                              })
                            });

                            const data = await res.json();
                            if (res.ok) {
                              setGlobalBanner({ type: 'success', text: `Verification successful! Test message dispatched to #${tester}` });
                            } else {
                              setGlobalBanner({ type: 'error', text: `Meta rejection: ${data?.error?.message || 'Check credentials'}` });
                            }
                          } catch (e: any) {
                            setGlobalBanner({ type: 'error', text: `Network error: ${e.message}` });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-hav-gold hover:bg-hav-forest text-hav-forest hover:text-hav-gold border border-hav-gold text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Launch Test Preview Sandbox Ping
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-hav-gold/10 flex justify-end gap-3 flex-shrink-0">
              <button 
                onClick={() => setShowWhatsappSettings(false)}
                className="px-6 py-2.5 bg-hav-forest text-hav-gold hover:text-hav-forest hover:bg-hav-gold border border-hav-gold/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md"
              >
                Close & Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

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
