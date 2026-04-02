  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      const cacheKey = 'uplat_listings_cache';

      try {
        const supabase = getSupabaseClient();

        // Check cache first (30s TTL)
        const cached = localStorage.getItem(cacheKey);
        const now = Date.now();
        if (cached) {
          const { ts, data } = JSON.parse(cached);
          if (now - ts < 30_000) {
            setListings(data as Listing[]);
            setLoading(false);
            return;
          }
        }

        let data: any[] | null = null;
        let error: any = null;
        for (let i = 0; i < 2; i++) {
          const res = await supabase
            .from("listings")
            .select('id, title, price_usd, type, mode, city, lat, lng, cover_image_url, headline, listing_type, property_type, image_urls, beds, baths, area_m2, status, contact_whatsapp, updated_at, published_at')
            .eq('status', 'published')
            .order("published_at", { ascending: false })
            .limit(500);
          data = res.data;
          error = res.error;
          if (!error || error?.status !== 401) break;
          await supabase.auth.signOut();
        }

        if (error) {
          console.error('[MapSection] load error:', error);
          // Clear potentially corrupted cache
          localStorage.removeItem(cacheKey);
          setErr('Error cargando propiedades. Intenta recargar.');
          setListings([]);
        } else {
          setListings((data ?? []) as Listing[]);
          // Cache
          localStorage.setItem(cacheKey, JSON.stringify({ ts: now, data: data ?? [] }));
        }
      } catch (e: unknown) {
        console.error('[MapSection] load exception:', e);
        localStorage.removeItem(cacheKey);
        const msg = e instanceof Error ? e.message : "Error cargando propiedades";
        setErr(msg);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);
