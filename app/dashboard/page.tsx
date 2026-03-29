import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface Stats {
  totalListings: number;
  publishedListings: number;
  totalUsers: number;
  totalAgents: number;
  totalAgencies: number;
  totalInquiries: number;
  inquiriesToday: number;
  inquiriesLast7Days: number;
  inquiriesLast30Days: number;
  avgInquiriesPerPublishedListing: number;
  waVerifiedUsers: number;
  verifiedAgencies: number;
  totalAgentLikes: number;
  totalAgentReviews: number;
  avgAgentRating: number;
  topAgents: Array<{ id: string; full_name: string | null; average_rating: number; review_count: number; likes_count: number; listing_count: number }>;
  topListingsByInquiries: Array<{ id: string; title: string | null; inquiry_count: number }>;
  topCountriesByPublishedListings: Array<{ country: string | null; count: number }>;
  recentInquiries: Array<{ id: string; listing_title: string | null; agent_name: string | null; created_at: string }>;
  recentUsers: Array<{ id: string; full_name: string | null; email: string | null; created_at: string }>;
  recentListings: Array<{ id: string; title: string | null; status: string; created_at: string }>;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(c => cookieStore.set(c.name, c.value, c.options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/signin?redirect=${encodeURIComponent('/dashboard')}`);

  // Check admin flag
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/');

  // Aggregations
  const [
    { count: totalListings },
    { count: publishedListings },
    { count: totalUsers },
    { count: totalAgents },
    { count: totalAgencies },
    { count: totalInquiries },
    { count: inquiriesToday },
    { count: inquiriesLast7Days },
    { count: inquiriesLast30Days },
    { data: waVerifiedUsersData },
    { count: verifiedAgencies },
    { count: totalAgentLikes },
    { count: totalAgentReviews },
    { data: agentReviewsForAvg },
    { data: topAgentsData },
    { data: topListingsData },
    { data: topCountriesData },
    { data: recentInquiriesData },
    { data: recentUsersData },
    { data: recentListingsData },
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'realtor'),
    supabase.from('agencies').select('*', { count: 'exact', head: true }),
    supabase.from('listing_inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('listing_inquiries').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('listing_inquiries').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('listing_inquiries').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('profiles').select('whatsapp_verified').eq('whatsapp_verified', true),
    supabase.from('agencies').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('agent_likes').select('*', { count: 'exact', head: true }),
    supabase.from('agent_reviews').select('*', { count: 'exact', head: true }),
    supabase.from('agent_reviews').select('rating'),
    supabase.from('profiles').select('id, full_name, average_rating, review_count, likes_count, listing_count').eq('role', 'realtor').order('average_rating', { ascending: false }).limit(5),
    supabase.from('listings').select('id, title, (listing_inquiries: listing_id)').order('created_at', { ascending: false }).limit(10),
    supabase.from('listings').select('country').eq('status', 'published'),
    supabase.from('listing_inquiries').select(`
      id,
      created_at,
      listing:listing_id ( title, profiles ( full_name ) )
    `).order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('listings').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(10),
  ]);

  const ratings = (agentReviewsForAvg ?? []).map((r: any) => r.rating as number);
  const avgAgentRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

  const listingInquiryMap = new Map<string, number>();
  (topListingsData ?? []).forEach((l: any) => {
    const count = (l.listing_inquiries as any[])?.length || 0;
    listingInquiryMap.set(l.id, count);
  });
  const topListingsByInquiries = (topListingsData ?? [])
    .map((l: any) => ({ id: l.id, title: l.title, inquiry_count: listingInquiryMap.get(l.id) || 0 }))
    .sort((a: any, b: any) => b.inquiry_count - a.inquiry_count)
    .slice(0, 5);

  const countryCounts = new Map<string, number>();
  (topCountriesData ?? []).forEach((l: any) => {
    const c = l.country as string;
    if (c) countryCounts.set(c, (countryCounts.get(c) || 0) + 1);
  });
  const topCountriesByPublishedListings = Array.from(countryCounts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentInquiries = (recentInquiriesData ?? []).map((r: any) => ({
    id: r.id,
    listing_title: r.listing?.title || null,
    agent_name: r.listing?.profiles?.full_name || null,
    created_at: r.created_at,
  }));

  const stats: Stats = {
    totalListings: totalListings ?? 0,
    publishedListings: publishedListings ?? 0,
    totalUsers: totalUsers ?? 0,
    totalAgents: totalAgents ?? 0,
    totalAgencies: totalAgencies ?? 0,
    totalInquiries: totalInquiries ?? 0,
    inquiriesToday: inquiriesToday ?? 0,
    inquiriesLast7Days: inquiriesLast7Days ?? 0,
    inquiriesLast30Days: inquiriesLast30Days ?? 0,
    avgInquiriesPerPublishedListing: (publishedListings ?? 0) > 0 ? (totalInquiries ?? 0) / (publishedListings ?? 0) : 0,
    waVerifiedUsers: waVerifiedUsersData?.length || 0,
    verifiedAgencies: verifiedAgencies ?? 0,
    totalAgentLikes: totalAgentLikes ?? 0,
    totalAgentReviews: totalAgentReviews ?? 0,
    avgAgentRating: avgAgentRating,
    topAgents: (topAgentsData ?? []).map((a: any) => ({
      id: a.id,
      full_name: a.full_name,
      average_rating: a.average_rating || 0,
      review_count: a.review_count || 0,
      likes_count: a.likes_count || 0,
      listing_count: a.listing_count || 0,
    })),
    topListingsByInquiries,
    topCountriesByPublishedListings,
    recentInquiries,
    recentUsers: (recentUsersData ?? []).map((u: any) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      created_at: u.created_at,
    })),
    recentListings: (recentListingsData ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      status: l.status,
      created_at: l.created_at,
    })),
  };

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Uplat Dashboard</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card title="Total Listings" value={stats.totalListings} />
        <Card title="Published Listings" value={stats.publishedListings} />
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Total Agents" value={stats.totalAgents} />
        <Card title="Total Agencies" value={stats.totalAgencies} />
        <Card title="Total Inquiries" value={stats.totalInquiries} />
      </div>

      {/* Conversion metrics */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Conversion</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Inquiries Today" value={stats.inquiriesToday} />
          <Card title="Last 7 Days" value={stats.inquiriesLast7Days} />
          <Card title="Last 30 Days" value={stats.inquiriesLast30Days} />
          <Card title="Avg per Published Listing" value={stats.avgInquiriesPerPublishedListing.toFixed(2)} />
        </div>
      </section>

      {/* Trust metrics */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Trust</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="WhatsApp Verified Users" value={stats.waVerifiedUsers} />
          <Card title="Verified Agencies" value={stats.verifiedAgencies} />
          <Card title="Total Agent Likes" value={stats.totalAgentLikes} />
          <Card title="Total Agent Reviews" value={stats.totalAgentReviews} />
          <Card title="Average Agent Rating" value={stats.avgAgentRating.toFixed(2)} />
        </div>
      </section>

      {/* Leaders */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Agents</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-right">Rating</th>
                <th className="p-2 text-right">Reviews</th>
                <th className="p-2 text-right">Likes</th>
                <th className="p-2 text-right">Listings</th>
              </tr>
            </thead>
            <tbody>
              {stats.topAgents.map(agent => (
                <tr key={agent.id}>
                  <td className="p-2">{agent.full_name || '—'}</td>
                  <td className="p-2 text-right">{agent.average_rating.toFixed(1)}</td>
                  <td className="p-2 text-right">{agent.review_count}</td>
                  <td className="p-2 text-right">{agent.likes_count}</td>
                  <td className="p-2 text-right">{agent.listing_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Listings by Inquiries</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-right">Inquiries</th>
              </tr>
            </thead>
            <tbody>
              {stats.topListingsByInquiries.map(l => (
                <tr key={l.id}>
                  <td className="p-2">{l.title || '—'}</td>
                  <td className="p-2 text-right">{l.inquiry_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Countries by Published Listings</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2 text-left">Country</th>
                <th className="p-2 text-right">Listings</th>
              </tr>
            </thead>
            <tbody>
              {stats.topCountriesByPublishedListings.map(c => (
                <tr key={c.country}>
                  <td className="p-2">{c.country}</td>
                  <td className="p-2 text-right">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Inquiries</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2 text-left">Listing</th>
                <th className="p-2 text-left">Agent</th>
                <th className="p-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentInquiries.map(i => (
                <tr key={i.id}>
                  <td className="p-2">{i.listing_title || '—'}</td>
                  <td className="p-2">{i.agent_name || '—'}</td>
                  <td className="p-2 text-right">{new Date(i.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map(u => (
                <tr key={u.id}>
                  <td className="p-2">{u.full_name || '—'}</td>
                  <td className="p-2">{u.email || '—'}</td>
                  <td className="p-2 text-right">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Listings</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentListings.map(l => (
                <tr key={l.id}>
                  <td className="p-2">{l.title || '—'}</td>
                  <td className="p-2">{l.status}</td>
                  <td className="p-2 text-right">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}