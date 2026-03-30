'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { es } from '@/app/i18n/es';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/user-settings')}`);
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-[1001] border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="text-lg font-bold tracking-tight">Tualero</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{profile?.full_name || profile?.email}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Perfil</h1>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
          <div>
            <div className="text-sm text-zinc-500">Nombre</div>
            <div className="font-medium">{profile?.full_name || '(sin nombre)'}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Correo electrónico</div>
            <div className="font-medium">{profile?.email || ''}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Rol</div>
            <div className="font-medium capitalize">{profile?.role}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Teléfono WhatsApp</div>
            <div className="font-medium">{profile?.whatsapp_number || '(no registrado)'}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Términos aceptados</div>
            <div className="font-medium">{profile?.terms_accepted ? 'Sí' : 'No'}</div>
          </div>
        </div>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Campos adicionales (biografía, ubicación, foto de perfil) estarán disponibles próximamente.
        </p>
      </main>
    </div>
  );
}
