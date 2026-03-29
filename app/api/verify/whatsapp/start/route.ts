import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Twilio from 'twilio';

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function POST(req: NextRequest) {
  try {
    console.log('[WhatsApp start] route invoked');
    // Read Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.slice('Bearer '.length);

    // Create Supabase client with service role to validate token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // required for server-side token validation
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.error('WhatsApp start auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    await client.verify.services(VERIFY_SERVICE_SID).verifications.create({
      to: phone.trim(),
      channel: 'whatsapp',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Twilio start error', err);
    return NextResponse.json({ error: err.message || 'Failed to start verification' }, { status: 500 });
  }
}