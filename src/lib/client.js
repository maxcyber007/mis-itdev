"use client";

/** เรียก API ภายในระบบ พร้อมแปลงข้อความ error ให้พร้อมแสดงผล */
export async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    cache: "no-store",
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `เกิดข้อผิดพลาด (${res.status})`);
  }
  return data;
}
