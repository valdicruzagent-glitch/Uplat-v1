import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    // Check verification code with Twilio
    const verificationCheck = await client.verify.services(VERIFY_SERVICE_SID).verificationChecks.create({
      to: `whatsapp:${phone}`,
      code,
    });

    if (verificationCheck.status === 'approved') {
      // Update profile: set whatsapp_number, whatsapp_verified, whatsapp_verified_at
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_number: phone,
          whatsapp_verified: true,
          whatsapp_verified_at: new Date().toISOString(),
        })
        .eq('id', user.id);
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