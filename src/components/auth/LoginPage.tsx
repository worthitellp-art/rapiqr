import React, { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import type { UserProfile } from "../../types";

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onSwitchToSignup: () => void;
  onBack: () => void;
}

export default function LoginPage({ onLoginSuccess, onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginHover, setLoginHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const profile: UserProfile = {
        email,
        fullName: email.split("@")[0],
        isLoggedIn: true,
        isSubscribed: false,
        subscriptionPlan: "free",
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(profile);
    }, 600);
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#fff",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              background: "#E25822",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}>
              <svg viewBox="0 0 32 32" width="18" height="18" fill="white">
                <rect x="4" y="4" width="9" height="9" rx="2" />
                <rect x="19" y="4" width="9" height="9" rx="2" />
                <rect x="4" y="19" width="9" height="9" rx="2" />
                <rect x="19" y="19" width="4" height="4" rx="1" />
                <rect x="25" y="25" width="3" height="3" rx="0.5" />
              </svg>
            </div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "-0.02em",
            }}>Sign in</h1>
            <p style={{
              fontSize: "14px",
              color: "#888",
              margin: "8px 0 0",
            }}>Welcome back to NamoQR</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#555",
                marginBottom: "8px",
              }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#bbb",
                  pointerEvents: "none",
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 42px",
                    border: "1.5px solid #e5e5e5",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    color: "#1a1a1a",
                    background: "#f8f8f8",
                    outline: "none",
                    transition: "border-color 0.2s, background 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E25822";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e5e5";
                    e.target.style.background = "#f8f8f8";
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}>
                <label style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#555",
                }}>Password</label>
                <button type="button" style={{
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#E25822",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                }}>Forgot?</button>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#bbb",
                  pointerEvents: "none",
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 44px 14px 42px",
                    border: "1.5px solid #e5e5e5",
                    fontSize: "15px",
                    fontFamily: "inherit",
                    color: "#1a1a1a",
                    background: "#f8f8f8",
                    outline: "none",
                    transition: "border-color 0.2s, background 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E25822";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e5e5";
                    e.target.style.background = "#f8f8f8";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#bbb",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#555"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#bbb"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnBase,
                border: "none",
                background: loginHover && !loading ? "#c9440c" : "#E25822",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transform: loginHover ? "translateY(-1px)" : "none",
              }}
              onMouseEnter={() => !loading && setLoginHover(true)}
              onMouseLeave={() => !loading && setLoginHover(false)}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "#eee" }} />
            <span style={{
              fontSize: "12px",
              color: "#aaa",
              fontWeight: 500,
            }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#eee" }} />
          </div>

          <button
            type="button"
            style={{
              ...btnBase,
              border: "1.5px solid #e5e5e5",
              background: googleHover ? "#f8f8f8" : "#fff",
              color: googleHover ? "#1a1a1a" : "#555",
              transform: googleHover ? "translateY(-1px)" : "none",
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
            Sign in with Google
          </button>

          <p style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#888",
            marginTop: "28px",
          }}>
            Don&apos;t have an account?{" "}
            <button
              onClick={onSwitchToSignup}
              style={{
                background: "none",
                border: "none",
                fontWeight: 600,
                color: "#E25822",
                cursor: "pointer",
                fontSize: "13px",
                padding: 0,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#c9440c"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#E25822"}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "-40%",
          right: "-20%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(226,88,34,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(226,88,34,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <svg viewBox="0 0 240 200" width="240" height="200" fill="none" style={{ margin: "0 auto 32px" }}>
            <rect x="50" y="20" width="60" height="60" rx="4" stroke="#E25822" strokeWidth="3" fill="rgba(226,88,34,0.1)" />
            <rect x="130" y="20" width="60" height="60" rx="4" stroke="#E25822" strokeWidth="3" fill="rgba(226,88,34,0.05)" />
            <rect x="20" y="100" width="60" height="60" rx="4" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="rgba(255,255,255,0.03)" />
            <rect x="100" y="100" width="40" height="40" rx="2" fill="#E25822" opacity="0.3" />
            <rect x="160" y="100" width="60" height="60" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="rgba(255,255,255,0.02)" />
            <circle cx="175" cy="175" r="8" fill="#E25822" opacity="0.4" />
            <circle cx="200" cy="145" r="5" fill="#E25822" opacity="0.3" />
            <rect x="50" y="100" width="20" height="20" rx="2" fill="#E25822" opacity="0.2" />
            <line x1="110" y1="120" x2="130" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <line x1="160" y1="130" x2="175" y2="165" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          </svg>
          <h2 style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "#fff",
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}>QR-powered safety<br />for what matters most</h2>
          <p style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)",
            maxWidth: "320px",
            lineHeight: "1.6",
            margin: "0 auto",
          }}>Your car, home, luggage and family — connected privately, one scan away.</p>
        </div>
      </div>
    </div>
  );
}
