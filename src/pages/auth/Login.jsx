import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const data = await loginUser(email.trim(), password);

      if (!data.token) {
        setError("Login response did not contain a token.");
        return;
      }

      const user = {
        name: data.name,
        email: data.email,
        role: data.role?.toUpperCase(),
      };

      const allowedRoles = [
        "CUSTOMER",
        "MECHANIC",
        "ADMIN",
        "SERVICE_ADVISOR",
      ];

      if (!user.role || !allowedRoles.includes(user.role)) {
        setError("Invalid or unsupported user role in login response.");
        return;
      }

      login(data.token, user);
      setMessage("Login successful!");

      const destinations = {
        CUSTOMER: "/customer",
        MECHANIC: "/mechanic",
        SERVICE_ADVISOR: "/advisor",
        ADMIN: "/admin",
      };

      navigate(destinations[user.role], { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          (err.response
            ? "Invalid email or password."
            : "Unable to connect to backend. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setMessage("Account created successfully! You can now log in.");
      setIsRegister(false);
      setName("");
      setPassword("");
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          (err.response
            ? "Unable to create account. Please check your details."
            : "Unable to connect to backend. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (register) => {
    setIsRegister(register);
    clearMessages();
    setPassword("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <section style={styles.hero}>
          <div style={styles.brand}>
            <div style={styles.logo}>⚙</div>
            <div>
              <h1 style={styles.brandTitle}>
                Vehicle Service
                <br />
                <span style={styles.blueText}>Management</span>
              </h1>
              <p style={styles.tagline}>
                Keep your vehicle running smoothly.
              </p>
            </div>
          </div>

          <div style={styles.heroContent}>
            <div style={styles.carIcon}>🚘</div>
            <h2 style={styles.heroTitle}>
              Your vehicle.
              <br />
              Our responsibility.
            </h2>
            <p style={styles.heroDescription}>
              Book services, monitor repairs, and stay updated on
              your vehicle's maintenance — all in one place.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>✓</span>
                <div>
                  <strong>Easy Service Booking</strong>
                  <p>Schedule your next service with ease.</p>
                </div>
              </div>

              <div style={styles.feature}>
                <span style={styles.featureIcon}>✓</span>
                <div>
                  <strong>Live Repair Updates</strong>
                  <p>Track progress and estimated costs.</p>
                </div>
              </div>

              <div style={styles.feature}>
                <span style={styles.featureIcon}>✓</span>
                <div>
                  <strong>Complete Vehicle Care</strong>
                  <p>Keep your service history organized.</p>
                </div>
              </div>
            </div>
          </div>

          <p style={styles.heroFooter}>
            BETTER SERVICE. SMOOTHER JOURNEYS.
          </p>
        </section>

        <main style={styles.rightPanel}>
          <div style={styles.card}>
            <div style={styles.mobileLogo}>⚙</div>

            <div style={styles.headingIcon}>
              {isRegister ? "✚" : "↗"}
            </div>

            <h2 style={styles.heading}>
              {isRegister ? "Create Your Account" : "Welcome Back!"}
            </h2>

            <p style={styles.subtitle}>
              {isRegister
                ? "Join us and make vehicle servicing easier."
                : "Sign in to manage your vehicles and service bookings."}
            </p>

            <form
              onSubmit={isRegister ? handleRegister : handleLogin}
              style={styles.form}
            >
              {isRegister && (
                <div style={styles.formGroup}>
                  <label htmlFor="name" style={styles.label}>
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    style={styles.input}
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label htmlFor="email" style={styles.label}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="password" style={styles.label}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isRegister
                      ? "Create a password (8+ characters)"
                      : "Enter your password"
                  }
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  minLength={isRegister ? 8 : undefined}
                  required
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.primaryButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create Customer Account →"
                    : "Login to Your Account →"}
              </button>
            </form>

            {message && (
              <div role="status" style={styles.success}>
                {message}
              </div>
            )}

            {error && (
              <div role="alert" style={styles.error}>
                {error}
              </div>
            )}

            <div style={styles.separator}>
              <span />
              <p>
                {isRegister
                  ? "Already have an account?"
                  : "New to Vehicle Service Management?"}
              </p>
              <span />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => switchMode(!isRegister)}
              style={styles.secondaryButton}
            >
              {isRegister ? "← Back to Login" : "+ Create Customer Account"}
            </button>

            <p style={styles.privacy}>
              Secure access · Personalized vehicle care
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#eef3fb",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#142342",
    boxSizing: "border-box",
  },
  layout: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.9fr)",
  },
  hero: {
    background:
      "radial-gradient(ellipse at 15% 85%, #174b89 0%, transparent 45%), linear-gradient(145deg, #07172f, #102e55 65%, #173d70)",
    color: "#ffffff",
    padding: "clamp(28px, 5vw, 68px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "35px",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },
  logo: {
    width: "62px",
    height: "62px",
    flexShrink: 0,
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "rgba(59, 130, 246, 0.18)",
    border: "1px solid rgba(147, 197, 253, 0.3)",
    color: "#60a5fa",
    fontSize: "39px",
  },
  brandTitle: {
    fontSize: "clamp(22px, 2.4vw, 34px)",
    lineHeight: 1.2,
    margin: 0,
    fontWeight: 800,
    letterSpacing: "-0.8px",
  },
  blueText: { color: "#60a5fa" },
  tagline: { color: "#bdcce2", fontSize: "14px", marginBottom: 0 },
  heroContent: { maxWidth: "520px", margin: "35px 0" },
  carIcon: {
    fontSize: "clamp(65px, 8vw, 105px)",
    marginBottom: "18px",
    filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.25))",
  },
  heroTitle: {
    fontSize: "clamp(30px, 3.5vw, 48px)",
    lineHeight: 1.15,
    letterSpacing: "-1.5px",
    margin: "0 0 18px",
  },
  heroDescription: {
    color: "#c4d3e8",
    fontSize: "16px",
    lineHeight: 1.8,
    maxWidth: "420px",
  },
  features: { display: "grid", gap: "23px", marginTop: "35px" },
  feature: { display: "flex", alignItems: "center", gap: "15px" },
  featureIcon: {
    display: "grid",
    placeItems: "center",
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "12px",
    background: "rgba(96, 165, 250, 0.18)",
    color: "#93c5fd",
    fontWeight: 800,
    fontSize: "19px",
  },
  heroFooter: {
    color: "#8fa9cb",
    fontSize: "11px",
    letterSpacing: "2px",
    margin: 0,
  },
  rightPanel: {
    padding: "clamp(18px, 4vw, 55px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    background:
      "radial-gradient(ellipse at top right, #dceaff, transparent 55%), #f5f8fd",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    padding: "clamp(24px, 4vw, 42px)",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(22, 52, 97, 0.11)",
    border: "1px solid #e7edf6",
    boxSizing: "border-box",
  },
  mobileLogo: { display: "none" },
  headingIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "17px",
    display: "grid",
    placeItems: "center",
    background: "#eaf2ff",
    color: "#2563eb",
    fontSize: "28px",
    fontWeight: 800,
    marginBottom: "22px",
  },
  heading: {
    color: "#102344",
    fontSize: "clamp(27px, 3vw, 34px)",
    fontWeight: 800,
    letterSpacing: "-1px",
    margin: "0 0 10px",
  },
  subtitle: {
    color: "#6b7b95",
    lineHeight: 1.7,
    fontSize: "14px",
    margin: "0 0 30px",
  },
  form: { display: "grid", gap: "21px" },
  formGroup: { display: "grid", gap: "9px" },
  label: { fontSize: "13px", fontWeight: 700, color: "#273957" },
  input: {
    width: "100%",
    height: "49px",
    boxSizing: "border-box",
    border: "1px solid #d6dfed",
    borderRadius: "10px",
    background: "#fbfcff",
    padding: "0 14px",
    color: "#152744",
    fontSize: "14px",
    outlineColor: "#2563eb",
  },
  primaryButton: {
    width: "100%",
    minHeight: "51px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(100deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 750,
    marginTop: "5px",
    boxShadow: "0 7px 16px rgba(37, 99, 235, 0.2)",
  },
  secondaryButton: {
    width: "100%",
    minHeight: "49px",
    border: "1px solid #b9ceff",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#245bd4",
    fontSize: "14px",
    fontWeight: 750,
    cursor: "pointer",
  },
  separator: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "26px 0 19px",
  },
  separatorLine: { background: "#e3eaf4" },
  privacy: {
    textAlign: "center",
    color: "#92a0b5",
    fontSize: "11px",
    margin: "23px 0 0",
  },
  success: {
    marginTop: "18px",
    padding: "12px",
    background: "#ecfdf3",
    color: "#167747",
    borderRadius: "9px",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  error: {
    marginTop: "18px",
    padding: "12px",
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: "9px",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};

export default Login;