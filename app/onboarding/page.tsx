import OnboardingClient from '@/app/components/OnboardingClient';
import { es } from '@/app/i18n/es';

const onboardingTranslations = {
  title: es.onboardingTitle,
  stepPhoneTitle: es.onboardingStepPhoneTitle,
  stepPhoneDesc: es.onboardingStepPhoneDesc,
  phonePlaceholder: es.phonePlaceholder,
  continue: es.continue,
  sending: es.sending,
  termsTitle: es.termsTitle,
  termsDescription: es.termsDescription,
  termsAccept: es.termsAccept,
  stepRoleTitle: es.onboardingStepRoleTitle,
  roleUser: es.onboardingRoleUser,
  roleRealtor: es.onboardingRoleRealtor,
  roleAgency: es.onboardingRoleAgency,
  finish: es.onboardingFinish,
  verifiedBadge: es.onboardingVerifiedBadge,
  errorRequired: es.onboardingErrorRequired,
  errorSaveProfile: es.onboardingErrorSave,
};

export default function OnboardingPage() {
  return <OnboardingClient locale="es" translations={onboardingTranslations} />;
}
