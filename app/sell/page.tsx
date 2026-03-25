import Link from 'next/link';

interface SearchParams {
  next?: string;
}

export default function SellPage({ searchParams }: { searchParams: SearchParams }) {
  const afterLogin = searchParams.next || '/sell/onboarding';

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Create Listing</h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-300">
          You must be signed in to create a listing.
        </p>
        <Link
          href={`/signin?next=${afterLogin}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded"
        >
          Sign in to continue
        </Link>
      </div>
    </div>
  );
}
