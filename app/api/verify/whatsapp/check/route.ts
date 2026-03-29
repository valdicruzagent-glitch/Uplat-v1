import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import Twilio from 'twilio';

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
          },
          setAll: () => {}, // no-op
        },
      }
    );

    const cookieHeader = req.headers.get('cookie');
    console.log('[WhatsApp check] Cookie header present:', !!cookieHeader, 'cookies count:', req.cookies.getAll().length);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[WhatsApp check] getUser result:', { userId: user?.id, authError });

    if (!user) {
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
