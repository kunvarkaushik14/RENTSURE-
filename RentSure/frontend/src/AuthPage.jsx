import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "./api";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Home,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import "./AuthPage.css";

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-spinner" />
        <p>Preparing your RentSure workspace...</p>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        });
      } else {
        await login({
          email: email.trim().toLowerCase(),
          password,
        });
      }

      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />

      <header className="auth-topbar">
        <Link to="/" className="auth-brand" aria-label="RentSure home">
          <span className="auth-brand-icon">
            <Home size={21} strokeWidth={2.3} />
          </span>
          <span className="auth-brand-word">
            Rent<span>Sure</span>
          </span>
        </Link>

        <Link to="/" className="auth-back-link">
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </Link>
      </header>

      <section className="auth-layout">
        <motion.div
          className="auth-story"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="auth-eyebrow">
            <span className="auth-status-dot" />
            RENTING, REIMAGINED
          </div>

          <h1>
            Your next home.
            <br />
            <span>Without the</span>
            <br />
            financial stress.
          </h1>

          <p className="auth-story-description">
            A smarter way to manage rental deposits, explore properties, and
            move forward with confidence.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-icon">
                <ShieldCheck size={20} />
              </span>
              <span>
                <strong>Security first</strong>
                <small>Your account is protected with authentication.</small>
              </span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">
                <Fingerprint size={20} />
              </span>
              <span>
                <strong>One simple account</strong>
                <small>Access your RentSure experience in one place.</small>
              </span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">
                <CheckCircle2 size={20} />
              </span>
              <span>
                <strong>Built for renters and landlords</strong>
                <small>A clearer rental journey for everyone.</small>
              </span>
            </div>
          </div>

          <div className="auth-trust-note">
            <LockKeyhole size={15} />
            Secure account access powered by RentSure
          </div>
        </motion.div>

        <motion.section
          className="auth-card"
          aria-labelledby="auth-title"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
        >
          <div className="auth-card-heading">
            <div className="auth-card-symbol">
              <ShieldCheck size={24} />
            </div>

            <p className="auth-card-kicker">
              {isRegister ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}
            </p>

            <h2 id="auth-title">
              {isRegister ? "Create your account" : "Sign in to RentSure"}
            </h2>

            <p>
              {isRegister
                ? "Create your account and make your next move with confidence."
                : "Your rental journey continues here."}
            </p>
          </div>

          <div className="auth-mode-switch" aria-label="Choose authentication view">
            <Link to="/login" className={!isRegister ? "active" : ""} aria-current={!isRegister ? "page" : undefined}>
              Sign in
            </Link>
            <Link to="/register" className={isRegister ? "active" : ""} aria-current={isRegister ? "page" : undefined}>
              Create account
            </Link>
          </div>

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                className="auth-error"
                role="alert"
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-field">
                <label htmlFor="fullName">Full name</label>
                <div className="auth-input-wrap">
                  <UserRound size={18} aria-hidden="true" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
                {!isRegister && <span className="auth-hint">Your account password</span>}
              </div>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? "At least 8 characters" : "Enter password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isRegister && (
                <p className="auth-field-helper">Use at least 8 characters for your password.</p>
              )}
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="role">I am joining as a</label>
                <select
                  id="role"
                  name="role"
                  className="auth-role-select"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="tenant">Tenant — looking for a home</option>
                  <option value="landlord">Landlord — managing a property</option>
                </select>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting
                ? "Please wait..."
                : isRegister
                  ? "Create my account"
                  : "Sign in securely"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-card-footer">
            <LockKeyhole size={14} />
            <span>Your credentials are sent securely to the RentSure API.</span>
          </div>
        </motion.section>
      </section>

      <footer className="auth-page-footer">
        <span>© {new Date().getFullYear()} RentSure</span>
        <span>Rent smarter. Move forward.</span>
      </footer>
    </main>
  );
}
