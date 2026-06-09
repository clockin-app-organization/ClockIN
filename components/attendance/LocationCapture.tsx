// components/attendance/LocationCapture.tsx
"use client";
import { useState, useEffect } from "react";

interface UseLocationResult {
  location: { lat: number; lng: number } | null;
  error: string | null;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Initialize error based on whether geolocation is supported (no effect needed)
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null; // SSR
    return !navigator.geolocation ? "Geolocation is not supported by this browser." : null;
  });

  useEffect(() => {
    // If already unsupported, skip
    if (error || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("The request to get user location timed out.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [error]); // Only run if there's no pre-existing error

  return { location, error };
}

export default useLocation;