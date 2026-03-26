import { useState, useEffect } from "react";

export interface GuestState {
  mapCenter?: { lat: number; lng: number };
  listingType?: "buy" | "rent";
  propertyTypes?: string[];
}

const STORAGE_KEY = "uplat_guest_state";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStorage(): GuestState {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStorage(state: GuestState) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadGuestState(): GuestState {
  return readStorage();
}

export function saveGuestState(partial: Partial<GuestState>) {
  const current = readStorage();
  const updated = { ...current, ...partial };
  writeStorage(updated);
}
