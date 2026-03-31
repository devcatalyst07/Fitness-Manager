"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, CreditCard, Lock, ChevronRight, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import authService from "@/services/authService";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ─── Stripe init ─────────────────────────────────────────────────────────────
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginType   = "user" | "admin";
type ModalType   = "login" | "register" | null;
type AccountType = "user" | "admin";

interface PlanInfo {
  name: string; price: string; amount: number; seats: string; description: string;
}

const PLAN_DETAILS: Record<string, PlanInfo> = {
  Starter:    { name: "Starter",    price: "$29/mo",  amount: 29,  seats: "3 seats",         description: "Perfect for small teams" },
  Team:       { name: "Team",       price: "$99/mo",  amount: 99,  seats: "10 seats",        description: "Ideal for growing organisations" },
  Enterprise: { name: "Enterprise", price: "$120/mo", amount: 120, seats: "Unlimited seats", description: "Full power, no limits" },
};

// ─── Stripe appearance (matches dark modal) ───────────────────────────────────
const stripeAppearance: import("@stripe/stripe-js").Appearance = {
  theme: "night",
  variables: {
    colorPrimary:         "#6366f1",
    colorBackground:      "#111118",
    colorText:            "#e2e8f0",
    colorDanger:          "#f87171",
    fontFamily:           "system-ui, sans-serif",
    borderRadius:         "12px",
    colorTextPlaceholder: "#475569",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "none",
      background: "rgba(255,255,255,0.05)",
    },
    ".Input:focus": {
      border: "1px solid rgba(99,102,241,0.6)",
      boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
    },
    ".Label": { color: "#94a3b8", fontWeight: "500" },
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface AuthModalProps {
  isOpen:             boolean;
  onClose:            () => void;
  modalType:          ModalType;
  onSwitchToRegister: () => void;
  preselectedPlan?:   string | null;
}

// ═════════════════════════════════════════════════════════════════════════════
// StepIndicator
// ═════════════════════════════════════════════════════════════════════════════
const StepIndicator: React.FC<{ steps: string[]; current: number }> = ({ steps, current }) => (
  <div className="flex items-center mb-7">
    {steps.map((label, i) => (
      <React.Fragment key={i}>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            style={{
              background: i < current ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : i === current ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
              color:      i < current ? "#fff" : i === current ? "#818cf8" : "#334155",
              border:     i === current ? "1px solid rgba(99,102,241,0.45)" : "1px solid transparent",
              boxShadow:  i === current ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
            }}
          >
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider hidden sm:block"
            style={{ color: i === current ? "#a5b4fc" : i < current ? "#6366f1" : "#334155" }}
          >
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className="flex-1 h-px mx-2 mb-4"
            style={{
              background: i < current ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.07)",
              transition: "background 0.4s",
            }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Field
// ═════════════════════════════════════════════════════════════════════════════
const Field: React.FC<{
  label: string; type: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; disabled?: boolean; autoFocus?: boolean;
}> = ({ label, type, value, onChange, placeholder, disabled, autoFocus }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled} autoFocus={autoFocus}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all duration-200"
        style={{
          background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
          border:     focused ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.09)",
          color:      disabled ? "#475569" : "#e2e8f0",
          boxShadow:  focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
          cursor:     disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PrimaryBtn
// ═════════════════════════════════════════════════════════════════════════════
const PrimaryBtn: React.FC<{
  onClick: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; icon?: React.ReactNode;
}> = ({ onClick, disabled, loading, children, icon }) => (
  <button
    onClick={onClick} disabled={disabled || loading}
    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200"
    style={{
      background: disabled || loading ? "rgba(99,102,241,0.25)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
      cursor:     disabled || loading ? "not-allowed" : "pointer",
      boxShadow:  !disabled && !loading ? "0 4px 20px rgba(99,102,241,0.35)" : "none",
    }}
  >
    {loading ? (
      <>
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Please wait…
      </>
    ) : <>{icon}{children}</>}
  </button>
);

// ═════════════════════════════════════════════════════════════════════════════
// GhostBtn
// ═════════════════════════════════════════════════════════════════════════════
const GhostBtn: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({
  onClick, disabled, children,
}) => (
  <button
    onClick={onClick} disabled={disabled}
    className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
    style={{
      background: "rgba(255,255,255,0.04)", color: disabled ? "#334155" : "#94a3b8",
      border: "1px solid rgba(255,255,255,0.07)", cursor: disabled ? "not-allowed" : "pointer",
    }}
  >
    {children}
  </button>
);

// ═════════════════════════════════════════════════════════════════════════════
// ErrorBanner
// ═════════════════════════════════════════════════════════════════════════════
const ErrorBanner: React.FC<{ message: string }> = ({ message }) =>
  message ? (
    <div
      className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm mb-4"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  ) : null;

// ═════════════════════════════════════════════════════════════════════════════
// InfoBanner
// ═════════════════════════════════════════════════════════════════════════════
const InfoBanner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="rounded-xl p-4 text-sm text-indigo-300 leading-relaxed"
    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
  >
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// PaymentForm — must live inside <Elements>
// ═════════════════════════════════════════════════════════════════════════════
interface PaymentFormProps {
  planId: string; email: string; name: string; password: string;
  onSuccess: () => void; onStripeError: (msg: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planId, email, name, onSuccess, onStripeError,
}) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,   setPaying]   = useState(false);
  const [ready,    setReady]    = useState(false);
  const [localErr, setLocalErr] = useState("");

  const plan = PLAN_DETAILS[planId] ?? PLAN_DETAILS["Starter"];

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLocalErr(""); onStripeError(""); setPaying(true);

    // 1. Validate the Stripe Elements form fields
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setLocalErr(submitError.message ?? "Please check your card details.");
      setPaying(false); return;
    }

    // 2. Confirm payment with Stripe using the clientSecret already embedded
    //    in the Elements provider (passed from parent via options.clientSecret)
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: { billing_details: { name, email } },
        // After 3-D Secure redirect Stripe will return here
        return_url: `${window.location.origin}/payment-complete`,
      },
      // Stay in-modal unless 3DS redirect is required
      redirect: "if_required",
    });

    if (confirmError) {
      setLocalErr(confirmError.message ?? "Payment failed. Please try again.");
      setPaying(false); return;
    }

    // Payment confirmed without redirect
    onSuccess();
  };

  return (
    <div className="space-y-5">
      {/* Plan summary */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <div>
          <p className="text-white font-semibold text-sm">{plan.name} Plan</p>
          <p className="text-slate-400 text-xs mt-0.5">{plan.seats} · {plan.description}</p>
        </div>
        <span className="text-lg font-bold" style={{ color: "#a5b4fc" }}>{plan.price}</span>
      </div>

      {/* Stripe PaymentElement — renders Card, Apple Pay, Google Pay, etc. */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Payment Details
        </p>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: "tabs",
            defaultValues: { billingDetails: { name, email } },
          }}
        />
      </div>

      {localErr && <ErrorBanner message={localErr} />}

      {/* Security row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "#6366f1" }} />
        <span>
          Secured by <strong className="text-slate-400">Stripe</strong> · PCI-DSS Level 1 ·
          256-bit TLS encryption
        </span>
      </div>

      <PrimaryBtn
        onClick={handlePay}
        disabled={!stripe || !ready}
        loading={paying}
        icon={<CreditCard className="w-4 h-4" />}
      >
        Pay {plan.price} &amp; Activate Account
      </PrimaryBtn>

      <p className="text-center text-xs text-slate-600">
        You'll be charged {plan.price} immediately, then monthly. Cancel any time from your dashboard.
      </p>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// AuthModal — main export
// ═════════════════════════════════════════════════════════════════════════════
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen, onClose, modalType, onSwitchToRegister, preselectedPlan,
}) => {
  const { login } = useAuth();

  const [activeTab,        setActiveTab]        = useState<LoginType>("user");
  const [name,             setName]             = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [subscriptionType, setSubscriptionType] = useState(preselectedPlan ?? "Starter");
  const [accountType,      setAccountType]      = useState<AccountType>("user");

  // step: 0 = account | 1 = verify email | 2 = payment (admin) / role-request (user)
  const [step,             setStep]             = useState(0);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState("");

  const [verificationCode, setVerificationCode] = useState("");
  const [verifyLoading,    setVerifyLoading]    = useState(false);
  const [resendLoading,    setResendLoading]    = useState(false);
  const [resendMsg,        setResendMsg]        = useState("");
  const [resendCooldown,   setResendCooldown]   = useState(0);

  const [requestAdminEmail, setRequestAdminEmail] = useState("");
  const [requestLoading,    setRequestLoading]    = useState(false);
  const [requestSuccess,    setRequestSuccess]    = useState(false);

  // clientSecret is fetched right after email verification (admin only)
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);
  const [paymentDone,  setPaymentDone]  = useState(false);

  useEffect(() => { if (preselectedPlan) setSubscriptionType(preselectedPlan); }, [preselectedPlan]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() =>
      setResendCooldown((p) => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const isAdminReg = accountType === "admin" && modalType === "register";
  const steps      = isAdminReg ? ["Account", "Verify Email", "Payment"] : ["Account", "Verify Email", "Access"];

  const resetAll = () => {
    setActiveTab("user"); setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setSubscriptionType(preselectedPlan ?? "Starter"); setAccountType("user");
    setStep(0); setLoading(false); setError("");
    setVerificationCode(""); setVerifyLoading(false); setResendLoading(false); setResendMsg(""); setResendCooldown(0);
    setRequestAdminEmail(""); setRequestLoading(false); setRequestSuccess(false);
    setClientSecret(null); setPendingSubscriptionId(null); setPaymentDone(false);
  };
  const handleClose = () => { resetAll(); onClose(); };

  // ── Step 0 ──
  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (modalType === "register") {
        if (!name || !email || !password) { setError("All fields are required."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        await authService.register({
          name, email, password, role: accountType,
          subscriptionType: accountType === "admin"
            ? (subscriptionType as "Starter" | "Team" | "Enterprise") : undefined,
        });
        setStep(1); setResendCooldown(30);
      } else {
        await login(email, password, false, activeTab); onClose();
      }
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg  = err?.response?.data?.message;
      if      (code === "NO_ROLE_ASSIGNED")    setError(msg ?? "No role assigned.");
      else if (code === "ROLE_LOGIN_MISMATCH") setError(msg ?? "Use the correct login tab.");
      else if (code === "EMAIL_NOT_VERIFIED")  { if (modalType === "register") setStep(1); setError(msg ?? "Verify your email."); }
      else if (err?.response?.status === 401 || err?.response?.status === 403) setError("Invalid credentials.");
      else setError(msg ?? err?.message ?? "Authentication failed.");
    } finally { setLoading(false); }
  };

  // ── Step 1 ──
  const handleVerifyCode = async () => {
    setError(""); setResendMsg("");
    if (!verificationCode.trim()) { setError("Verification code is required."); return; }
    try {
      setVerifyLoading(true);
      await authService.verifyEmailCode(email, verificationCode.trim());
      if (isAdminReg) {
        // Pre-fetch the PaymentIntent so Elements mounts immediately
        const res = await apiClient.post<{
          clientSecret: string;
          subscriptionId: string;
        }>("/api/payments/create-intent", { planId: subscriptionType, email });
        setClientSecret(res.clientSecret);
        setPendingSubscriptionId(res.subscriptionId);
      }
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Verification failed.");
    } finally { setVerifyLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(""); setResendMsg("");
    try {
      setResendLoading(true);
      await authService.resendVerificationCode(email);
      setResendMsg("Code sent!"); setResendCooldown(30);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to resend code.");
    } finally { setResendLoading(false); }
  };

  // ── Step 2 user ──
  const handleRoleRequest = async () => {
    setError("");
    if (!requestAdminEmail) { setError("Admin email is required."); return; }
    setRequestLoading(true);
    try {
      await apiClient.post("/api/auth/request-role", { adminEmail: requestAdminEmail, userEmail: email });
      if (typeof window !== "undefined") localStorage.setItem("roleRequestSentAt", new Date().toISOString());
      setRequestSuccess(true); setTimeout(() => onClose(), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to send request.");
    } finally { setRequestLoading(false); }
  };

  // ── Step 2 admin: payment done ──
  const handlePaymentSuccess = async () => {
    if (!pendingSubscriptionId) {
      setError("Subscription activation is missing. Please retry payment.");
      return;
    }

    try {
      await apiClient.post("/api/payments/confirm-subscription", {
        email,
        subscriptionId: pendingSubscriptionId,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Payment succeeded but subscription activation failed. Please contact support.",
      );
      return;
    }

    setPaymentDone(true);
    try { await login(email, password, false, "admin"); } catch {}
    setTimeout(() => onClose(), 2200);
  };

  const title = () => {
    if (modalType === "login") return "Welcome back";
    if (step === 0) return "Create your account";
    if (step === 1) return "Verify your email";
    if (step === 2 && isAdminReg) return "Subscription payment";
    if (step === 2 && !isAdminReg) return "Request access";
    return "You're all set";
  };
  const subtitle = () => {
    if (modalType === "login") return "Sign in to continue";
    if (step === 0) return "Start managing fitout projects today";
    if (step === 1) return `We sent a 6-digit code to ${email}`;
    if (step === 2 && isAdminReg) return `${PLAN_DETAILS[subscriptionType]?.name} · ${PLAN_DETAILS[subscriptionType]?.price}`;
    if (step === 2 && !isAdminReg) return "An admin will assign your role shortly";
    return "";
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl"
        style={{
          background: "linear-gradient(160deg,#111118 0%,#16162a 100%)",
          border:     "1px solid rgba(255,255,255,0.07)",
          boxShadow:  "0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(99,102,241,0.08)",
          maxHeight:  "92vh",
          overflowY:  "auto",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg,transparent,#6366f1 40%,#8b5cf6 60%,transparent)" }}
        />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
        >
          <X size={16} />
        </button>

        <div className="p-7 sm:p-8">
          {/* ── LOGO: original black square + white building icon ── */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "#000" }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-[15px] leading-none">Fitout Manager</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Project Management Platform</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white leading-tight">{title()}</h2>
            <p className="text-sm text-slate-400 mt-1">{subtitle()}</p>
          </div>

          {/* Step indicator */}
          {modalType === "register" && <StepIndicator steps={steps} current={step} />}

          {/* Login tabs */}
          {modalType === "login" && (
            <div className="flex rounded-xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.04)" }}>
              {(["user", "admin"] as LoginType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setError(""); }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={
                    activeTab === tab
                      ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }
                      : { color: "#64748b" }
                  }
                >
                  {tab === "admin" ? "Admin" : "User"}
                </button>
              ))}
            </div>
          )}

          <ErrorBanner message={error} />

          {/* ──────────── STEP 0: Account form ──────────── */}
          {(modalType === "login" || step === 0) && !paymentDone && (
            <div className="space-y-4">
              {modalType === "register" && (
                <>
                  <Field label="Full Name" type="text" value={name} onChange={setName} placeholder="John Smith" autoFocus />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Account Type</p>
                    <div className="flex rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
                      {(["user", "admin"] as AccountType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setAccountType(t)}
                          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                          style={
                            accountType === t
                              ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }
                              : { color: "#64748b" }
                          }
                        >
                          {t === "user" ? "User" : "Admin"}
                        </button>
                      ))}
                    </div>
                    {accountType === "admin" && (
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Admin accounts require a subscription payment
                      </p>
                    )}
                  </div>
                </>
              )}

              <Field label="Email Address" type="email" value={email} onChange={setEmail}
                placeholder={activeTab === "admin" ? "admin@yourcompany.com" : "you@example.com"} />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

              {modalType === "register" && (
                <>
                  <Field label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
                  {accountType === "admin" && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Choose a Plan</p>
                      <div className="space-y-2">
                        {Object.entries(PLAN_DETAILS).map(([id, p]) => (
                          <label
                            key={id}
                            className="flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200"
                            style={{
                              background: subscriptionType === id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                              border:     subscriptionType === id ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <input type="radio" name="plan" value={id} checked={subscriptionType === id}
                                onChange={() => setSubscriptionType(id)} className="w-4 h-4 accent-indigo-500" />
                              <div>
                                <p className="text-sm font-semibold text-white">{p.name}</p>
                                <p className="text-xs text-slate-400">{p.seats}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold" style={{ color: "#818cf8" }}>{p.price}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <PrimaryBtn
                onClick={handleSubmit} loading={loading}
                icon={modalType === "register" ? <ChevronRight className="w-4 h-4" /> : undefined}
              >
                {modalType === "register" ? "Continue" : "Sign In"}
              </PrimaryBtn>

              {modalType === "login" && activeTab === "user" && (
                <p className="text-center text-sm text-slate-400">
                  No account?{" "}
                  <button
                    onClick={onSwitchToRegister}
                    className="font-semibold transition-colors"
                    style={{ color: "#818cf8" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a5b4fc")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#818cf8")}
                  >
                    Create account
                  </button>
                </p>
              )}
              {modalType === "login" && activeTab === "admin" && (
                <p className="text-center text-xs text-slate-600">Admin accounts must be registered first</p>
              )}
            </div>
          )}

          {/* ──────────── STEP 1: Email verification ──────────── */}
          {modalType === "register" && step === 1 && (
            <div className="space-y-4">
              <InfoBanner>
                We sent a 6-digit verification code to{" "}
                <strong className="text-white">{email}</strong>. Enter it below to continue.
              </InfoBanner>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Verification Code</p>
                <input
                  type="text" inputMode="numeric" value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={6} placeholder="000000" autoFocus
                  className="w-full px-4 py-4 rounded-xl text-white text-center text-2xl font-bold outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    letterSpacing: "0.5em",
                  }}
                  onFocus={(e) => (e.target.style.border = "1px solid rgba(99,102,241,0.6)")}
                  onBlur={(e)  => (e.target.style.border = "1px solid rgba(255,255,255,0.1)")}
                />
              </div>

              <PrimaryBtn onClick={handleVerifyCode} loading={verifyLoading} disabled={verificationCode.length < 6}>
                Verify &amp; Continue
              </PrimaryBtn>
              <GhostBtn onClick={handleResend} disabled={resendLoading || resendCooldown > 0}>
                {resendLoading ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </GhostBtn>
              {resendMsg && (
                <p className="text-center text-sm text-green-400 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> {resendMsg}
                </p>
              )}
            </div>
          )}

          {/* ──────────── STEP 2 (admin): Stripe Payment ──────────── */}
          {modalType === "register" && step === 2 && isAdminReg && !paymentDone && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance }}
            >
              <PaymentForm
                planId={subscriptionType} email={email} name={name} password={password}
                onSuccess={handlePaymentSuccess} onStripeError={(msg) => setError(msg)}
              />
            </Elements>
          )}

          {/* Waiting for clientSecret */}
          {modalType === "register" && step === 2 && isAdminReg && !paymentDone && !clientSecret && (
            <div className="flex items-center justify-center py-10 gap-3 text-slate-400 text-sm">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Setting up payment…
            </div>
          )}

          {/* ──────────── STEP 2 (user): Role request ──────────── */}
          {modalType === "register" && step === 2 && !isAdminReg && (
            <div className="space-y-4">
              {requestSuccess ? (
                <div
                  className="rounded-xl p-6 text-center"
                  style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(34,197,94,0.15)" }}
                  >
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-green-300 font-semibold">Request sent!</p>
                  <p className="text-sm text-green-500 mt-1">The admin will review and assign your role shortly. Closing…</p>
                </div>
              ) : (
                <>
                  <InfoBanner>
                    Your account is created. Provide the admin email so they can assign you a role and grant access.
                  </InfoBanner>
                  <Field label="Your Email" type="email" value={email} onChange={() => {}} disabled />
                  <Field label="Admin Email" type="email" value={requestAdminEmail} onChange={setRequestAdminEmail}
                    placeholder="admin@yourcompany.com" autoFocus />
                  <PrimaryBtn onClick={handleRoleRequest} loading={requestLoading}>Send Role Request</PrimaryBtn>
                  <GhostBtn onClick={handleClose}>Skip for Now</GhostBtn>
                </>
              )}
            </div>
          )}

          {/* ──────────── Payment success ──────────── */}
          {paymentDone && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.15)" }}
              >
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-green-300 font-bold text-lg">Payment successful!</p>
              <p className="text-sm text-green-500 mt-1">Your account is active. Redirecting to your dashboard…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};