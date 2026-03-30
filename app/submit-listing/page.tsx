import SiteHeader from "@/app/components/SiteHeader";
import SubmitListingForm from "@/app/submit-listing/submitListingForm";
import { es } from "@/app/i18n/es";

export default function SubmitListingPage() {
  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{es.submitListingTitle}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{es.submitListingSubtitle}</p>
          </div>
          <SubmitListingForm locale="es" />
        </div>
      </main>
    </>
  );
}
