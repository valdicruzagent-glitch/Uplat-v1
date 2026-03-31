'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from "@/lib/supabaseClient";
import termsES from '@/content/legal/terms.es';
import termsEN from '@/content/legal/terms.en';
import { ensureProfileExists, getOnboardingProgress } from '@/app/lib/onboarding-progress';
import { es } from '@/app/i18n/es';
import { en } from '@/app/i18n/en';

const supabase = getSupabaseClient();

type Country = {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
};

const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', dialCode: '1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dialCode: '1', flag: '🇨🇦' },
  { name: 'Mexico', code: 'MX', dialCode: '52', flag: '🇲🇽' },
  { name: 'Guatemala', code: 'GT', dialCode: '502', flag: '🇬🇹' },
  { name: 'Honduras', code: 'HN', dialCode: '504', flag: '🇭🇳' },
  { name: 'El Salvador', code: 'SV', dialCode: '503', flag: '🇸🇻' },
  { name: 'Nicaragua', code: 'NI', dialCode: '505', flag: '🇳🇮' },
  { name: 'Costa Rica', code: 'CR', dialCode: '506', flag: '🇨🇷' },
  { name: 'Panama', code: 'PA', dialCode: '507', flag: '🇵🇦' },
  { name: 'Colombia', code: 'CO', dialCode: '57', flag: '🇨🇴' },
  { name: 'Venezuela', code: 'VE', dialCode: '58', flag: '🇻🇪' },
  { name: 'Ecuador', code: 'EC', dialCode: '593', flag: '🇪🇨' },
  { name: 'Peru', code: 'PE', dialCode: '51', flag: '🇵🇪' },
  { name: 'Bolivia', code: 'BO', dialCode: '591', flag: '🇧🇴' },
  { name: 'Chile', code: 'CL', dialCode: '56', flag: '🇨🇱' },
  { name: 'Argentina', code: 'AR', dialCode: '54', flag: '🇦🇷' },
  { name: 'Uruguay', code: 'UY', dialCode: '598', flag: '🇺🇾' },
  { name: 'Paraguay', code: 'PY', dialCode: '595', flag: '🇵🇾' },
  { name: 'Brazil', code: 'BR', dialCode: '55', flag: '🇧🇷' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '1', flag: '🇩🇴' },
  { name: 'Puerto Rico', code: 'PR', dialCode: '1', flag: '🇵🇷' },
  { name: 'Cuba', code: 'CU', dialCode: '53', flag: '🇨🇺' },
];

function splitPhoneNumber(fullNumber: string): { country: Country; local: string } | null {
  if (!fullNumber.startsWith('+')) return null;
  const digits = fullNumber.slice(1);
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialCode)) {
      const local = digits.slice(c.dialCode.length);
      return { country: c, local };
    }
  }
  return null;
}

interface OnboardingProps {
  locale: 'es' | 'en'; // initial UI locale from route
}

type Step = 'phone' | 'terms' | 'role' | 'done';
const steps: Step[] = ['phone', 'terms', 'role'];

const roleOptions = [
  {
    value: 'user' as const,
    labels: {
      es: {
        title: 'Quiero comprar o rentar una propiedad',
        subtitle: 'Explora propiedades y contacta directamente a agentes o agencias.',
      },
      en: {
        title: 'I want to buy or rent a property',
        subtitle: 'Explore listings and connect directly with agents or agencies.',
      },
    },
  },
  {
    value: 'realtor' as const,
    labels: {
      es: {
        title: 'Soy agente inmobiliario / realtor',
        subtitle: 'Publica propiedades, recibe leads y gestiona tu presencia profesional.',
      },
      en: {
        title: 'I am a real estate agent / realtor',
        subtitle: 'Publish listings, receive leads, and manage your professional presence.',
      },
    },
  },
  {
    value: 'agency' as const,
    labels: {
      es: {
        title: 'Represento una agencia inmobiliaria',
        subtitle: 'Administra la presencia de tu agencia y publica propiedades de tu equipo.',
      },
      en: {
        title: 'I represent a real estate agency',
        subtitle: 'Manage your agency presence and publish listings for your team.',
      },
    },
  },
];

export default function OnboardingClient({ locale: initialLocale }: OnboardingProps) {
  const router = useRouter();
  const [uiLocale, setUiLocale] = useState<'es' | 'en'>(initialLocale);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [role, setRole] = useState<'user' | 'realtor' | 'agency' | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const t = uiLocale === 'es' ? es : en;
  const currentStepIndex = steps.indexOf(step);
  const totalSteps = steps.length;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/signin?redirect=${encodeURIComponent('/onboarding')}`);
        return;
      }

      await ensureProfileExists();

      const progress = await getOnboardingProgress();
      setStep(progress.step as Step);
      if (progress.phone) {
        setPhone(progress.phone);
        const parsed = splitPhoneNumber(progress.phone);
        if (parsed) {
          setSelectedCountry(parsed.country);
          setLocalPhone(parsed.local);
        } else {
          setLocalPhone(progress.phone.replace(/^\+/, ''));
        }
      }

      if (progress.step === 'role') {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profile?.role) {
          if (profile.role === 'user') router.push('/');
          else router.push('/user-settings');
          return;
        }
      }

      setInitializing(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (role) {
      completeOnboarding();
    }
  }, [role]);

  const continueFromPhone = async () => {
    if (!localPhone.trim()) {
      setErrorMsg(t.onboardingErrorRequired);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fullPhone = `+${selectedCountry.dialCode}${localPhone.replace(/\D/g, '')}`;
      setPhone(fullPhone);

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        phone: fullPhone,
        whatsapp_number: fullPhone,
      });
      if (error) throw error;

      setStep('terms');
      setStatus('idle');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const completeOnboarding = async () => {
    setStatus('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
        role,
        phone: phone.trim(),
        whatsapp_number: phone.trim(),
        email: user.email,
        avatar_url: user.user_metadata?.picture || null,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      setStep('done');
      setStatus('idle');

      setTimeout(() => {
        if (role === 'user') router.push('/');
        else if (role === 'realtor' || role === 'agency') router.push('/user-settings');
      }, 500);
    } catch (err: any) {
      console.error('Onboarding complete error:', err);
      setErrorMsg(t.onboardingErrorSave);
      setStatus('error');
    }
  };

  if (initializing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.loading}</p>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="p-4 border rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {t.onboardingVerifiedBadge}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {uiLocale === 'es' ? 'Redirigiendo...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center bg-zinc-50 dark:bg-black p-6">
      {/* Header with language toggle */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <div className="flex gap-2">
          <button
            className={`text-sm px-3 py-1 rounded ${uiLocale === 'es' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-700'}`}
            onClick={() => setUiLocale('es')}
          >
            ES
          </button>
          <button
            className={`text-sm px-3 py-1 rounded ${uiLocale === 'en' ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-700'}`}
            onClick={() => setUiLocale('en')}
          >
            EN
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tualero</h1>
      </div>

      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>{uiLocale === 'es' ? 'Paso' : 'Step'} {currentStepIndex + 1} {uiLocale === 'es' ? 'de' : 'of'} {totalSteps}</span>
          <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {step === 'phone' && (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-1">{t.onboardingStepPhoneTitle}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.onboardingStepPhoneDesc}</p>
            </div>
            <div className="space-y-3">
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800"
                value={selectedCountry.code}
                onChange={(e) => {
                  const country = COUNTRIES.find(c => c.code === e.target.value);
                  if (country) setSelectedCountry(country);
                }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} (+{c.dialCode})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800"
                placeholder={t.phonePlaceholder}
                value={localPhone}
                onChange={e => setLocalPhone(e.target.value)}
              />
            </div>
            <button
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={continueFromPhone}
              disabled={status === 'loading' || !localPhone.trim()}
            >
              {status === 'loading' ? t.sending : t.continue}
            </button>
          </>
        )}

        {step === 'terms' && (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-1">{t.termsTitle}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.termsDescription}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-sm leading-relaxed overflow-y-auto max-h-80 whitespace-pre-wrap">
              {uiLocale === 'es' ? termsES : termsEN}
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300"
              />
              <span>{t.termsAccept}</span>
            </label>
            <button
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={() => { if (termsAccepted) setStep('role'); }}
              disabled={!termsAccepted}
            >
              {t.onboardingFinish}
            </button>
          </>
        )}

        {step === 'role' && (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-1">{t.onboardingStepRoleTitle}</h2>
            </div>
            <div className="space-y-3">
              {roleOptions.map(opt => (
                <button
                  key={opt.value}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 text-left shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                  onClick={() => setRole(opt.value)}
                >
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{opt.labels[uiLocale].title}</div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{opt.labels[uiLocale].subtitle}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {status === 'error' && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{errorMsg}</p>}
      </div>
    </div>
  );
}
