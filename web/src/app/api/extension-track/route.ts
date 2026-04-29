import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { event_type, address, language, timestamp, source } = body;

    // Telemetry Logging
    // In production, Vercel console buffers this perfectly. 
    // You could also forward this to Supabase if a DB connection is active.
    console.log(`[EXTENSION-TELEMETRY]`, {
      type: event_type || 'unknown',
      address_scanned: address ? address.slice(0, 50) : 'none', // truncating for PII safety
      lang: language || 'unknown',
      src: source || 'chrome_extension',
      time: timestamp || new Date().toISOString()
    });

    return NextResponse.json(
      { success: true, message: 'Telemetry received' },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[EXTENSION-TELEMETRY] Internal error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
