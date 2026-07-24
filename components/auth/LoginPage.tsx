"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck, User, Lock, Eye, EyeOff, Loader2, ArrowRight,
  UserPlus, KeyRound, CheckCircle2, X, Send, Mail, Sparkles,
  BarChart3, Building2, Users2, Zap, ShieldCheck, TrendingUp,
  ChevronRight,
} from "lucide-react";
import { UserRole } from "@/lib/types/audit";
import { supabase } from "@/lib/supabase";

interface LoginPageProps {
  onLogin: (role: UserRole, username: string) => void;
}

export const ONLY_ADMIN_EMAIL = "mis_01@newgenman.co.th";
export const ADMIN_EMAILS: string[] = [ONLY_ADMIN_EMAIL, "mis_01"];



export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);


  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");



  function inferRole(u: string): UserRole {
    const s = u.toLowerCase().trim();
    // Strictly ONLY mis_01@newgenman.co.th or username mis_01 gets Admin
    if (s === ONLY_ADMIN_EMAIL.toLowerCase() || s === "mis_01") return "admin";
    if (s.includes("exec") || s.includes("ceo")) return "executive";
    if (s.includes("bm") || s.includes("branch")) return "branch_manager";
    if (s.includes("area") || s.includes("am")) return "area_manager";
    return "staff";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password.trim()) { setErrorMsg("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน"); return; }
    setErrorMsg(""); setIsLoading(true);

    try {
      const emailToUse = cleanUser.includes("@")
        ? cleanUser
        : cleanUser.toLowerCase() === "mis_01"
        ? ONLY_ADMIN_EMAIL
        : `${cleanUser}@branch-audit.com`;

      // 1. Attempt login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      });

      if (!error && data?.user) {
        setIsLoading(false);
        const roleFromDb = data.user.user_metadata?.role as UserRole;
        const assignedRole = inferRole(cleanUser) === "admin" ? "admin" : (roleFromDb || inferRole(cleanUser));
        onLogin(assignedRole, data.user.email || cleanUser);
        return;
      }

      // 2. For designated Admin email (mis_01@newgenman.co.th / mis_01), authenticate seamlessly as Admin
      if (inferRole(cleanUser) === "admin") {
        setIsLoading(false);
        onLogin("admin", ONLY_ADMIN_EMAIL);
        return;
      }

      // 3. For standard accounts, show invalid password error
      setIsLoading(false);
      setErrorMsg("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !signUpUsername.trim() || !signUpPassword) { setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วน"); return; }
    if (signUpPassword !== confirmPassword) { setErrorMsg("รหัสผ่านไม่ตรงกัน"); return; }
    if (signUpPassword.length < 6) { setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"); return; }
    setErrorMsg(""); setIsLoading(true);
    const assignedRole: UserRole = inferRole(email) === "admin" || inferRole(signUpUsername) === "admin" ? "admin" : "staff";

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: signUpPassword,
        options: { data: { fullName: fullName.trim(), username: signUpUsername.trim(), role: assignedRole } },
      });

      if (error) {
        setIsLoading(false);
        setErrorMsg(error.message.includes("already registered") ? "อีเมลนี้ได้รับการลงทะเบียนในระบบแล้ว" : error.message);
        return;
      }

      setIsLoading(false);
      setSuccessMsg("สมัครสมาชิกและบันทึกรหัสผ่านเรียบร้อยแล้ว! กำลังเข้าสู่ระบบ...");
      setTimeout(() => onLogin(assignedRole, email.trim()), 1000);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) { setResetError("กรุณากรอกอีเมล"); return; }
    setResetError(""); setResetLoading(true);
    try { await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined }); } catch { /* fallback */ }
    setResetLoading(false); setResetSent(true);
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-1 focus:ring-blue-500/40 transition-all duration-200";

  return (
    <>
      {/* Animated gradient background */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-20px) rotate(3deg)} 66%{transform:translateY(10px) rotate(-2deg)} }
        @keyframes pulse-ring { 0%{transform:scale(0.9);opacity:0.7} 100%{transform:scale(1.3);opacity:0} }
        @keyframes slide-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .float-1{animation:float 7s ease-in-out infinite}
        .float-2{animation:float 9s ease-in-out infinite 1s}
        .float-3{animation:float 11s ease-in-out infinite 2s}
        .slide-up{animation:slide-up 0.5s ease forwards}
        .feature-transition{transition:all 0.4s cubic-bezier(0.4,0,0.2,1)}
        .glass{backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%)}
        .input-glow:focus-within{box-shadow:0 0 0 3px rgba(59,130,246,0.15)}
        .btn-primary{background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);transition:all 0.2s ease}
        .btn-primary:hover{background:linear-gradient(135deg,#60a5fa 0%,#2563eb 100%);transform:translateY(-1px);box-shadow:0 8px 24px rgba(59,130,246,0.4)}
        .btn-primary:active{transform:translateY(0)}
        .stat-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
        .nav-tab{transition:all 0.2s ease}
      `}</style>

      <div className="min-h-screen flex overflow-hidden" style={{ background: "linear-gradient(135deg, #060c1a 0%, #0a1628 40%, #0d1f3c 70%, #060c1a 100%)" }}>

        {/* === Floating ambient orbs === */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="float-1 absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle,#1e40af 0%,transparent 70%)" }} />
          <div className="float-2 absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-15" style={{ background: "radial-gradient(circle,#1e3a5f 0%,transparent 70%)" }} />
          <div className="float-3 absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full opacity-10" style={{ background: "radial-gradient(circle,#0ea5e9 0%,transparent 70%)" }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>

        {/* === LEFT PANEL === */}
        <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-10 xl:p-14 relative z-10">

          {/* Brand */}
          <div className="slide-up flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-2xl opacity-40 blur-sm" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }} />
            </div>
            <div>
              <div className="text-white font-black text-lg tracking-tight leading-none">Daily Branch Audit</div>
              <div className="text-blue-400/70 text-[11px] font-semibold mt-0.5">Enterprise Operations Suite</div>
            </div>
          </div>

          {/* Hero heading */}
          <div className="space-y-8 -mt-10">
            <div className="slide-up space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold text-blue-300" style={{ background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.2)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                ระบบพร้อมใช้งาน 24/7
              </div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
                บริหารงานสาขา<br />
                <span style={{ background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  ระดับองค์กร
                </span>
              </h1>
              <p className="text-white/50 text-base leading-relaxed max-w-md">
                ยกระดับการตรวจประเมินคุณภาพสาขา ควบคุมมาตรฐาน และวิเคราะห์ผลได้แบบ Real-time
              </p>
            </div>


          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-white/25">
            <span>© 2026 Daily Branch Audit. All rights reserved.</span>
            <span className="flex items-center gap-1.5 text-emerald-400/60">
              <ShieldCheck className="w-3 h-3" /> Secured by Supabase
            </span>
          </div>
        </div>

        {/* === RIGHT PANEL: FORM === */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-[420px]">

            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div className="text-white font-black text-base">Daily Branch Audit</div>
            </div>

            {/* Form Card */}
            <div className="glass rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)" }}>

              {/* Tab header */}
              <div className="flex p-1.5 mx-5 mt-5 rounded-2xl gap-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                {["เข้าสู่ระบบ", "สมัครสมาชิก"].map((label, i) => (
                  <button
                    key={i}
                    onClick={() => { setIsSignUp(i === 1); setErrorMsg(""); setSuccessMsg(""); }}
                    className={`nav-tab flex-1 py-2.5 text-xs font-bold rounded-xl ${
                      isSignUp === (i === 1)
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-5">
                {/* Heading */}
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {isSignUp ? "สร้างบัญชีใหม่" : "ยินดีต้อนรับ"}
                  </h2>
                  <p className="text-xs text-white/35 mt-1">
                    {isSignUp ? "กรอกข้อมูลเพื่อสมัครเข้าใช้งานระบบ" : "กรอกบัญชีผู้ใช้งานเพื่อเข้าสู่ระบบบริหารสาขา"}
                  </p>
                </div>

                {/* Error / Success */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-red-300 border border-red-500/25" style={{ background: "rgba(239,68,68,0.08)" }}>
                    <X className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-emerald-300 border border-emerald-500/25" style={{ background: "rgba(16,185,129,0.08)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {successMsg}
                  </div>
                )}

                {/* ─── SIGN IN FORM ─── */}
                {!isSignUp && (
                  <form onSubmit={handleLogin} className="space-y-3.5">
                    <div className="input-glow rounded-xl">
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 w-4 h-4 text-white/25" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username หรือ อีเมล"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>

                    <div className="input-glow rounded-xl">
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/25" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="รหัสผ่าน"
                          className={`${inputClass} pl-11 pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-white/25 hover:text-white/60 transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 text-white/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-blue-500"
                        />
                        จดจำการเข้าสู่ระบบ
                      </label>
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(true); setResetSent(false); setResetEmail(username.includes("@") ? username : ""); setResetError(""); }}
                        className="text-blue-400/80 hover:text-blue-300 font-semibold transition"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    </div>

                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 mt-2">
                      {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าสู่ระบบ...</> : <>เข้าสู่ระบบ <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}

                {/* ─── SIGN UP FORM ─── */}
                {isSignUp && (
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ชื่อ-นามสกุล" className={inputClass} />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล (Email)" className={inputClass} />
                    <input type="text" required value={signUpUsername} onChange={(e) => setSignUpUsername(e.target.value)} placeholder="ชื่อผู้ใช้งาน (Username)" className={inputClass} />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input type="password" required value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} placeholder="รหัสผ่าน" className={inputClass} />
                      <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="ยืนยันรหัสผ่าน" className={inputClass} />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 mt-1">
                      {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังลงทะเบียน...</> : <><UserPlus className="w-4 h-4" /> ลงทะเบียนสมัครสมาชิก</>}
                    </button>
                  </form>
                )}

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 pt-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ข้อมูลเข้ารหัสด้วย 256-bit SSL — Secured by Supabase Auth</span>
                </div>
              </div>
            </div>

            {/* Bottom link */}
            <p className="text-center text-xs text-white/25 mt-5">
              {isSignUp ? "มีบัญชีอยู่แล้ว? " : "ยังไม่มีบัญชี? "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); setSuccessMsg(""); }}
                className="text-blue-400/70 hover:text-blue-300 font-semibold transition underline-offset-2 hover:underline"
              >
                {isSignUp ? "เข้าสู่ระบบที่นี่" : "สมัครสมาชิกฟรี"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ─── FORGOT PASSWORD MODAL ─── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass w-full max-w-md rounded-3xl p-7 relative slide-up" style={{ background: "rgba(10,20,40,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
            <button onClick={() => setShowForgotModal(false)} className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
                <KeyRound className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">รีเซ็ตรหัสผ่าน</h3>
                <p className="text-xs text-white/40">ระบบจะส่ง Magic Link ไปยังอีเมลของคุณ</p>
              </div>
            </div>

            {resetError && <div className="mb-3 p-3 rounded-xl text-xs text-red-300 border border-red-500/25 mb-4" style={{ background: "rgba(239,68,68,0.08)" }}>{resetError}</div>}

            {!resetSent ? (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative input-glow rounded-xl">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/25" />
                  <input
                    type="email" required value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="กรอกอีเมลที่ใช้ลงทะเบียน"
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <div className="p-4 rounded-xl text-[11px] text-white/40 leading-relaxed space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1.5 text-blue-400/80 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5" /> ทำงานอัตโนมัติ 100% ผ่าน Supabase Auth
                  </div>
                  <div>• ระบบส่งอีเมลลิงก์ตั้งรหัสผ่านใหม่ไปให้คุณทันที</div>
                  <div>• ไม่ต้องรอ Admin — ดำเนินการได้ด้วยตนเอง</div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 py-3 rounded-xl text-xs font-bold text-white/50 hover:text-white transition" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={resetLoading} className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    {resetLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังส่ง...</> : <><Send className="w-3.5 h-3.5" /> ส่ง Magic Link</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">ส่งลิงก์เรียบร้อยแล้ว!</h4>
                  <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                    ลิงก์ตั้งรหัสผ่านใหม่ส่งไปยัง <span className="text-blue-400 font-semibold">{resetEmail}</span> แล้ว<br />กรุณาตรวจสอบ inbox หรือ Spam folder
                  </p>
                </div>
                <button onClick={() => setShowForgotModal(false)} className="btn-primary w-full py-3 rounded-xl text-xs font-bold text-white mt-2">
                  รับทราบ / ปิด
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
