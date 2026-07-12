import React, { useState, type FormEvent } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import type { UserProfile } from "../../types";

interface RegisterPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px 11px 36px",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "10px",
  fontSize: "13.5px",
  fontFamily: "inherit",
  color: "#fff",
  background: "rgba(255,255,255,0.06)",
  outline: "none",
  transition: "border-color 0.25s, background 0.25s",
  boxSizing: "border-box",
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "100px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

export default function RegisterPage({ onLoginSuccess, onSwitchToLogin, onBack }: RegisterPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupHover, setSignupHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const profile: UserProfile = {
        email,
        fullName,
        isLoggedIn: true,
        isSubscribed: false,
        subscriptionPlan: "free",
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(profile);
    }, 600);
  };

  return (
    <div style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        padding: "0 20px",
      }}>
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "-44px",
            left: "20px",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "color 0.25s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "white"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
        >
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
          Back
        </button>

        <div style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "20px",
          padding: "34px 28px 28px",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "26px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E25822, #FF8A4C)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 4px 12px rgba(226,88,34,0.4)",
            }}>
              <svg viewBox="0 0 32 32" width="20" height="20" fill="white">
                <rect x="4" y="4" width="9" height="9" rx="2" />
                <rect x="19" y="4" width="9" height="9" rx="2" />
                <rect x="4" y="19" width="9" height="9" rx="2" />
                <rect x="19" y="19" width="4" height="4" rx="1" />
                <rect x="25" y="25" width="3" height="3" rx="0.5" />
              </svg>
            </div>
            <h1 style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#fff",
              margin: 0,
            }}>Create account</h1>
            <p style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              margin: "4px 0 0",
            }}>Join NamoQR and protect what matters</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                marginBottom: "6px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>Full name</label>
              <div style={{ position: "relative" }}>
                <User size={14} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)",
                  pointerEvents: "none",
                }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E25822";
                    e.target.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.15)";
                    e.target.style.background = "rgba(255,255,255,0.06)";
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                marginBottom: "6px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)",
                  pointerEvents: "none",
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E25822";
                    e.target.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.15)";
                    e.target.style.background = "rgba(255,255,255,0.06)";
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                marginBottom: "6px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)",
                  pointerEvents: "none",
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  style={{ ...inputStyle, paddingRight: "36px" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E25822";
                    e.target.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.15)";
                    e.target.style.background = "rgba(255,255,255,0.06)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnBase,
                border: signupHover && !loading ? "1px solid rgba(255,255,255,0.3)" : "none",
                background: loading
                  ? "linear-gradient(135deg, #C4471A, #E25822)"
                  : signupHover
                    ? "#fff"
                    : "linear-gradient(135deg, #E25822, #FF8A4C)",
                color: loading ? "#fff" : signupHover ? "#201C15" : "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: "2px",
                transform: signupHover ? "translateY(-1px) scale(1.01)" : "none",
              }}
              onMouseEnter={() => !loading && setSignupHover(true)}
              onMouseLeave={() => !loading && setSignupHover(false)}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "20px 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            <span style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          </div>

          <button
            type="button"
            style={{
              ...btnBase,
              border: googleHover
                ? "1px solid rgba(255,255,255,0.3)"
                : "1px solid rgba(255,255,255,0.15)",
              background: googleHover ? "#fff" : "rgba(255,255,255,0.06)",
              color: googleHover ? "#201C15" : "#fff",
              transform: googleHover ? "translateY(-1px) scale(1.01)" : "none",
            }}
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => setGoogleHover(false)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <div style={{
            textAlign: "center",
            marginTop: "20px",
            paddingTop: "18px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: "13px",
            color: "rgba(255,255,255,0.4)",
          }}>
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              style={{
                background: "none",
                border: "none",
                fontWeight: 700,
                color: "#FF8A4C",
                cursor: "pointer",
                fontSize: "13px",
                padding: 0,
                transition: "color 0.25s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#FF8A4C"}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
