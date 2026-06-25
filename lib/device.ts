// lib/device.ts
/**
 * Deterministic device fingerprint using available browser signals.
 * Stored in localStorage so repeat scans get auto-fill.
 */

const CACHE_KEY = "smart_attendance_device_cache";
const FP_KEY    = "smart_attendance_device_fp";

export interface DeviceCache {
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  designation: string;
}

/** Generate or retrieve a stable device fingerprint */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";

  // Return cached fingerprint if exists
  const cached = localStorage.getItem(FP_KEY);
  if (cached) return cached;

  // Build fingerprint from browser signals
  const signals = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? 0,
  ].join("|");

  // Hash with subtle crypto if available
  if (window.crypto?.subtle) {
    try {
      const encoded = new TextEncoder().encode(signals);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fp = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
      localStorage.setItem(FP_KEY, fp);
      return fp;
    } catch {
      // fall through
    }
  }

  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < signals.length; i++) {
    hash = (Math.imul(31, hash) + signals.charCodeAt(i)) | 0;
  }
  const fp = Math.abs(hash).toString(16).padStart(8, "0") + Date.now().toString(16);
  localStorage.setItem(FP_KEY, fp);
  return fp;
}

/** Save form data to localStorage cache after successful submission */
export function saveDeviceCache(data: DeviceCache): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

/** Retrieve cached form data for auto-fill */
export function loadDeviceCache(): DeviceCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear cached form data */
export function clearDeviceCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}