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
    console.log('[WhatsApp check] route invoked');
    const authHeader = req.headers.get('Authorization');
    console.log('[WhatsApp check] Authorization header exists:', !!authHeader);
    const isBearer = authHeader?.startsWith('Bearer ');
    console.log('[WhatsApp check] Bearer prefix:', isBearer);
    if (!isBearer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.slice('Bearer '.length);
    console.log('[WhatsApp check] Token length:', accessToken.length);

    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[WhatsApp check] SUPABASE_SERVICE_ROLE_KEY exists:', hasServiceKey);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('[WhatsApp check] getUser result:', user ? { userId: user.id } : null, 'error:', authError);
    if (authError || !user) {
      console.error('WhatsApp check auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const verificationCheck = await client.verify.services(VERIFY_SERVICE_SID).verificationChecks.create({
      to: `whatsapp:${phone}`,
      code,
    });

    if (verificationCheck.status === 'approved') {
      // Upsert profile verification fields and WhatsApp number
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          whatsapp_number: phone,
          whatsapp_verified: true,
          whatsapp_verified_at: new Date().toISOString(),
        });
      if (error) throw error;

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Twilio check error', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
