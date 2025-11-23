// Database helper for Supabase (production)

import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

// Initialize Supabase client
function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    
    // Support multiple environment variable naming conventions
    const supabaseUrl = process.env.SUPABASE_URL || 
                       process.env.SUPABASE_PROJECT_URL ||
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // Only use service role key for server-side operations
    // Never fall back to anon key as it has limited permissions
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE;
    
    if (supabaseUrl && supabaseKey) {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized with service role key');
        return supabaseClient;
    }
    
    console.log('⚠️ Supabase not configured - service role key required');
    return null;
}

// Save order to database (Supabase only)
async function saveOrder(orderData) {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    try {
        const { data, error } = await supabase
            .from('orders')
            .insert({
                stripe_session_id: orderData.stripe_session_id,
                customer_email: orderData.customer_email,
                amount_total: orderData.amount_total,
                currency: orderData.currency || 'usd',
                payment_status: orderData.payment_status,
                items: typeof orderData.items === 'string' ? orderData.items : JSON.stringify(orderData.items)
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Supabase error:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            throw new Error(`Supabase error: ${error.message || error.code || 'Unknown error'}`);
        }
        
        console.log('💾 Order saved to Supabase with ID:', data.id);
        return { id: data.id, ...data };
    } catch (error) {
        console.error('❌ Failed to save to Supabase:', error);
        throw error;
    }
}

// Create digital access token
async function createDigitalAccess(accessData) {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    try {
        const { data, error } = await supabase
            .from('digital_access')
            .insert({
                order_id: accessData.order_id,
                stripe_session_id: accessData.stripe_session_id,
                customer_email: accessData.customer_email,
                product_id: accessData.product_id,
                download_token: accessData.download_token,
                expires_at: accessData.expires_at
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Failed to create digital access:', error);
            throw error;
        }
        
        console.log('🔑 Digital access token created in Supabase');
        return data;
    } catch (error) {
        console.error('❌ Supabase error:', error);
        throw error;
    }
}

// Get all orders
async function getAllOrders() {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
        throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Failed to fetch orders from Supabase:', error);
        throw error;
    }
}

export {
    saveOrder,
    createDigitalAccess,
    getAllOrders,
    getSupabaseClient
};

