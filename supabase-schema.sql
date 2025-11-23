-- Supabase Database Schema for byJ. Store

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    stripe_session_id TEXT UNIQUE NOT NULL,
    customer_email TEXT,
    amount_total DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    payment_status TEXT,
    items JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital access table for download tokens
CREATE TABLE IF NOT EXISTS digital_access (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    stripe_session_id TEXT,
    customer_email TEXT,
    product_id TEXT,
    download_token TEXT UNIQUE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_digital_access_token ON digital_access(download_token);
CREATE INDEX IF NOT EXISTS idx_digital_access_session ON digital_access(stripe_session_id);

-- Enable Row Level Security (optional, for security)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_access ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for server-side operations)
CREATE POLICY "Service role can manage orders" ON orders
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage digital_access" ON digital_access
    FOR ALL
    USING (auth.role() = 'service_role');


