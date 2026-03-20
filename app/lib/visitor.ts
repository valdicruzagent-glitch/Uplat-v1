"use client";

const KEY = "uplat_visitor_id";

function randomId(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const id = `visitor_${randomId(6)}`;
  window.localStorage.setItem(KEY, id);
  return id;
}
