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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.slice('Bearer '.length);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
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
