const GUEST_STATE_KEY = "uplat_guest_state_v1";

export type GuestState = {
  listingType: "buy" | "rent";
  propertyTypes: string[];
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number | null;
  selectedLocationLabel: string | null;
  userLocation: { lat: number; lng: number } | null;
  locationPermissionAsked: boolean;
  lastSeenAt: string;
};

const DEFAULT_STATE: GuestState = {
  listingType: "buy",
  propertyTypes: ["house", "apartment", "land", "farm"],
  mapCenter: null,
  mapZoom: null,
  selectedLocationLabel: null,
  userLocation: null,
  locationPermissionAsked: false,
  lastSeenAt: new Date().toISOString(),
};

export function loadGuestState(): GuestState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(GUEST_STATE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGuestState(patch: Partial<GuestState>) {
  if (typeof window === "undefined") return;
  try {
    const current = loadGuestState();
    const updated = { ...current, ...patch, lastSeenAt: new Date().toISOString() };
    localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save guest state:", e);
  }
}

export function clearGuestState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_STATE_KEY);
  } catch (e) {
    console.error("Failed to clear guest state:", e);
  }
}
