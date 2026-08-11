"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconPackage,
  IconSpinner,
  IconUser,
  IconWallet,
  IconWarning,
} from "@/components/Icons";

const FEATURES = [
  {
    icon: IconPackage,
    title: "งานพัสดุ",
    text: "เบิกจ่ายวัสดุ ยืม-คืนครุภัณฑ์ พร้อมตัดสต๊อกอัตโนมัติ",
  },
  {
    icon: IconWallet,
    title: "งานการเงิน",
    text: "เบิกจ่ายเงิน และยืมเงินทดรองพร้อมขั้นตอนล้างหนี้",
  },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px] animate-fade-up">
      <div className="mb-8 text-center lg:hidden">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-950 text-lg font-bold text-white shadow-lift">
          IT
        </span>
        <h1 className="text-xl font-bold text-ink-900">ระบบ MIS</h1>
        <p className="mt-1 text-sm text-ink-500">
          แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่
        </p>
      </div>

      <div className="card p-7 shadow-lift sm:p-8">
        <div className="mb-7">
          <h2 className="text-xl font-bold tracking-tight text-ink-900">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-ink-500">
            กรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแลระบบ
          </p>
        </div>

        {error ? (
          <div className="mb-5 flex animate-fade-down items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
            <IconWarning className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="label" htmlFor="username">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <IconUser className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="username"
                className="input pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="เช่น admin"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              รหัสผ่าน
            </label>
            <div className="relative">
              <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input pl-10 pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-600"
              >
                {showPassword ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? <IconSpinner /> : null}
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear() + 543} แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* ฝั่งซ้าย: แบรนด์ (แสดงบนจอใหญ่) */}
      <section className="relative hidden w-1/2 overflow-hidden bg-brand-950 lg:flex xl:w-[55%]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-[28rem] w-[28rem] animate-aurora-1 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] animate-aurora-2 rounded-full bg-sky-400/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="flex animate-fade-up items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white ring-1 ring-inset ring-white/20 backdrop-blur">
              IT
            </span>
            <div>
              <p className="font-semibold text-white">ระบบ MIS</p>
              <p className="text-xs text-white/50">Management Information System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="animate-fade-up text-balance text-4xl font-bold leading-tight text-white stagger-1 xl:text-[2.75rem]">
              ระบบสารสนเทศเพื่อการจัดการ
              <span className="mt-2 block bg-gradient-to-r from-brand-200 to-sky-200 bg-clip-text text-transparent">
                งานพัสดุและงานการเงิน
              </span>
            </h1>
            <p className="mt-5 animate-fade-up text-white/60 stagger-2">
              แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่
            </p>

            <div className="mt-10 space-y-4">
              {FEATURES.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`flex animate-fade-up items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition duration-300 hover:border-white/20 hover:bg-white/[0.08] ${
                    index === 0 ? "stagger-3" : "stagger-4"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-white">{feature.title}</p>
                    <p className="mt-0.5 text-sm text-white/50">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="animate-fade-up text-xs text-white/35 stagger-5">
            ใช้งานภายในสถานศึกษาเท่านั้น
          </p>
        </div>
      </section>

      {/* ฝั่งขวา: ฟอร์มเข้าสู่ระบบ */}
      <section className="flex flex-1 items-center justify-center bg-ink-50 px-4 py-10 sm:px-8">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 text-ink-400">
              <IconSpinner className="h-5 w-5" />
              กำลังโหลด...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
