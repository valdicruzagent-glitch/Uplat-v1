export type DeviceInfo = {
  device_type: "mobile" | "tablet" | "desktop" | "unknown";
  os: string | null;
  browser: string | null;
  viewport_w: number | null;
  viewport_h: number | null;
  is_touch: boolean | null;
};

function detectOS(ua: string): string | null {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipod/i.test(ua)) return "iOS";
  if (/ipad/i.test(ua)) return "iPadOS";
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return null;
}

function detectBrowser(ua: string): string | null {
  // order matters: Chrome UA contains Safari
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua) && !/crios\//i.test(ua)) return "Safari";
  if (/crios\//i.test(ua)) return "Chrome (iOS)";
  return null;
}

function detectDeviceType(ua: string, viewportW: number | null): DeviceInfo["device_type"] {
  const isIPad = /ipad/i.test(ua);
  const isTablet = isIPad || (/android/i.test(ua) && !/mobi/i.test(ua));
  const isMobile = /mobi|iphone|ipod|android/i.test(ua) && !isTablet;

  if (isTablet) return "tablet";
  if (isMobile) return "mobile";

  // fallback heuristic by viewport
  if (viewportW != null && viewportW <= 820) return "mobile";
  return "desktop";
}

export function getClientDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      device_type: "unknown",
      os: null,
      browser: null,
      viewport_w: null,
      viewport_h: null,
      is_touch: null,
    };
  }

  const ua = window.navigator.userAgent || "";
  const viewportW = typeof window.innerWidth === "number" ? window.innerWidth : null;
  const viewportH = typeof window.innerHeight === "number" ? window.innerHeight : null;
  const isTouch =
    ("ontouchstart" in window) ||
    (typeof window.navigator.maxTouchPoints === "number" && window.navigator.maxTouchPoints > 0);

  return {
    device_type: detectDeviceType(ua, viewportW),
    os: detectOS(ua),
    browser: detectBrowser(ua),
    viewport_w: viewportW,
    viewport_h: viewportH,
    is_touch: Boolean(isTouch),
  };
}
