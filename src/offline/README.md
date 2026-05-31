# Havikar Offline Store POS & CRM Panel

This is a **standalone, offline-first Point of Sale (POS) and Customer Relation Management (CRM) system** designed precisely for in-store checkout staff at Havikar. 

The application is completely self-contained within this directory (`src/offline`). You can copy this folder out of the repository, place it on any machine, and compile/run it with standard npm commands.

---

## Technical Features

1. **New Sale Checkout Register**:
   - Customer search autocomplete with 2+ characters limit.
   - Intelligent inline toggles to automatically update/update old numbers or save addresses inside client CRM.
   - Responsive Order Cart supporting real-time weight-wise product addition and quantity controls.
   - Flexible inputs for Overalls Discount (₹), customized Shipping and Additional Charges.
   - Payment status tracking (`Paid Full`, `Partial Payment`, `Payment Pending`) and delivery tracking.
2. **Order Queue**:
   - Shows live in-store sales cards modeled after specific staffing templates.
   - Single-click action buttons to flag problems, mark deliveries, refund items, or cancel.
   - Direct integration with **WhatsApp API**: Pre-compiles order details, invoice price, and fulfillment status into a formatted string ready to send to clients via WhatsApp with a single click.
3. **Advanced Customer CRM**:
   - Fast responsive client directories with totals spent calculators and orders history logs.
   - Expandable rows listing address details, and internal store notes. 
4. **Offline Resilience & Sync**:
   - Fallbacks to local client storage (`localStorage`) if Supabase tables are offline or missing.
   - Core stock modifiers allowing quick manual stock edits synced back to the database.

---

## How to Run This Folder Independently

If you want to copy this folder out and build it separately as its own standalone website:

1. **Extract this folder**: Copy the entire `/src/offline` folder to your local machine.
2. **Open Terminal**: Navigate to the directory:
   ```bash
   cd offline
   ```
3. **Install Dependencies**:
   ```bash
   npm install && npm run build
   ```
4. **Boot Dev Server**:
   ```bash
   npm run dev
   ```

---

## Supabase SQL Schema setup

Copy and execute this script inside your **Supabase dashboard SQL Editor** to establish the POS tables:

```sql
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

-- Enable RLS and insert default policies for access
ALTER TABLE offline_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write offline customers" ON offline_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write offline orders" ON offline_orders FOR ALL USING (true) WITH CHECK (true);
```
