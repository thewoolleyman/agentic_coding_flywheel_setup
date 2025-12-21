/**
 * User Preferences Storage
 *
 * Handles localStorage persistence of user choices during the wizard.
 * Uses TanStack Query for React state management with localStorage persistence.
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "./utils";

export type OperatingSystem = "mac" | "windows";

const OS_KEY = "acfs-user-os";
const VPS_IP_KEY = "acfs-vps-ip";

// Query keys for TanStack Query
export const userPreferencesKeys = {
  userOS: ["userPreferences", "os"] as const,
  vpsIP: ["userPreferences", "vpsIP"] as const,
  detectedOS: ["userPreferences", "detectedOS"] as const,
};

/**
 * Get the user's selected operating system from localStorage.
 */
export function getUserOS(): OperatingSystem | null {
  const stored = safeGetItem(OS_KEY);
  if (stored === "mac" || stored === "windows") {
    return stored;
  }
  return null;
}

/**
 * Save the user's operating system selection to localStorage.
 */
export function setUserOS(os: OperatingSystem): void {
  safeSetItem(OS_KEY, os);
}

/**
 * Detect the user's OS from the browser's user agent.
 * Returns null if detection fails or on server-side.
 */
export function detectOS(): OperatingSystem | null {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  return null;
}

/**
 * Get the user's VPS IP address from localStorage.
 */
export function getVPSIP(): string | null {
  return safeGetItem(VPS_IP_KEY);
}

/**
 * Save the user's VPS IP address to localStorage.
 * Only saves if the IP is valid to prevent storing malformed data.
 * Returns true if saved successfully, false otherwise.
 */
export function setVPSIP(ip: string): boolean {
  if (!isValidIP(ip)) {
    return false;
  }
  return safeSetItem(VPS_IP_KEY, ip);
}

/**
 * Validate an IP address (basic IPv4 validation).
 */
export function isValidIP(ip: string): boolean {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;

  const parts = ip.split(".");
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

// --- React Hooks for User Preferences ---
// Using useState/useEffect instead of TanStack Query for reliable synchronous access
// This avoids race conditions where redirects happen before async queries resolve

/**
 * Hook to get and set the user's operating system.
 * Uses useState/useEffect for reliable synchronous localStorage access.
 */
export function useUserOS(): [OperatingSystem | null, (os: OperatingSystem) => void] {
  const [os, setOSState] = useState<OperatingSystem | null>(null);

  // Read from localStorage on mount (intentional - SSR-safe pattern)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: localStorage is only available client-side
    setOSState(getUserOS());
  }, []);

  const setOS = useCallback((newOS: OperatingSystem) => {
    setUserOS(newOS);
    setOSState(newOS);
  }, []);

  return [os, setOS];
}

/**
 * Hook to get and set the VPS IP address.
 * Uses useState/useEffect for reliable synchronous localStorage access.
 */
export function useVPSIP(): [string | null, (ip: string) => void] {
  const [ip, setIPState] = useState<string | null>(null);

  // Read from localStorage on mount (intentional - SSR-safe pattern)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: localStorage is only available client-side
    setIPState(getVPSIP());
  }, []);

  const setIP = useCallback((newIP: string) => {
    if (setVPSIP(newIP)) {
      setIPState(newIP);
    }
  }, []);

  return [ip, setIP];
}

/**
 * Hook to get the detected OS (from user agent).
 * Only runs on client side.
 */
export function useDetectedOS(): OperatingSystem | null {
  const { data: detectedOS } = useQuery({
    queryKey: userPreferencesKeys.detectedOS,
    queryFn: detectOS,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return detectedOS ?? null;
}

/**
 * Hook to track if the component is mounted (client-side hydrated).
 * Returns true once the component is mounted on the client.
 *
 * Uses useState/useEffect instead of TanStack Query because:
 * 1. Mount detection is synchronous, not async data fetching
 * 2. TanStack Query introduces unnecessary latency on first render
 * 3. This pattern is more reliable and doesn't depend on query resolution
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: standard hydration detection pattern
    setMounted(true);
  }, []);

  return mounted;
}
