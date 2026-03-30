import OnboardingClient from '@/app/components/OnboardingClient';
import { en } from '@/app/i18n/en';

const onboardingTranslations = {
  title: en.onboardingTitle,
  stepPhoneTitle: en.onboardingStepPhoneTitle,
  stepPhoneDesc: en.onboardingStepPhoneDesc,
  phonePlaceholder: en.phonePlaceholder,
  continue: en.continue,
  sending: en.sending,
  termsTitle: en.termsTitle,
  termsDescription: en.termsDescription,
  termsAccept: en.termsAccept,
  stepRoleTitle: en.onboardingStepRoleTitle,
  roleUser: en.onboardingRoleUser,
  roleRealtor: en.onboardingRoleRealtor,
  roleAgency: en.onboardingRoleAgency,
  finish: en.onboardingFinish,
  verifiedBadge: en.onboardingVerifiedBadge,
  errorRequired: en.onboardingErrorRequired,
  errorSaveProfile: en.onboardingErrorSave,
};

export default function OnboardingPage() {
  return <OnboardingClient locale="en" translations={onboardingTranslations} />;
}
