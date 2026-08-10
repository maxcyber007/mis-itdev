"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mis-login-card">
      <div className="card-body p-4 p-md-5">
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 64, height: 64, background: "var(--mis-brand)" }}
          >
            <span className="fs-3 text-white fw-bold">IT</span>
          </div>
          <h1 className="h4 fw-bold mb-1">ระบบ MIS</h1>
          <p className="text-secondary small mb-0">
            แผนกวิชาเทคโนโลยีสารสนเทศ
            <br />
            วิทยาลัยเทคนิคเชียงใหม่
          </p>
        </div>

        {error ? (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label" htmlFor="username">
              ชื่อผู้ใช้
            </label>
            <input
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="password">
              รหัสผ่าน
            </label>
            <div className="input-group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={loading}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <hr className="my-4" />
        <p className="small text-secondary mb-1 fw-semibold">บัญชีตัวอย่าง</p>
        <ul className="small text-secondary mb-0 ps-3">
          <li>ผู้ดูแลระบบ: admin / admin1234</li>
          <li>เจ้าหน้าที่: staff / staff1234</li>
          <li>ผู้ใช้ทั่วไป: user / user1234</li>
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mis-login">
      <Suspense fallback={<div className="text-white">กำลังโหลด...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
