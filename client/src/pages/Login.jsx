import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "";

const Login = ({
  onLogin,
  onSwitchToRegister,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!formData.password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Invalid login response from server"
        );
      }

      /*
       * App.jsx handles:
       * - localStorage
       * - user state
       * - redirecting to Notes
       */
      onLogin(data);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">✦</div>

          <span>Notes Service</span>
        </div>
        <h1>Welcome Back</h1>

        <p>
          Sign in to manage your notes
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

        <p className="auth-link">
          Don't have an account?{" "}

          <button
            type="button"
            className="auth-switch-button"
            onClick={onSwitchToRegister}
          >
            Create an account
          </button>
        </p>

      </div>
    </div>
  );
};

export default Login;