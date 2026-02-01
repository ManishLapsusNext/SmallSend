import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Lock, Mail, Loader2, UserPlus } from "lucide-react";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/login",
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess(true);
        // Automatically redirect to login after a short delay
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <UserPlus size={32} className="logo-icon" />
          </div>
          <h1>Join SmallSend</h1>
          <p>Create your private Data Room in seconds</p>
        </div>

        {success ? (
          <div className="signup-success">
            <div className="success-icon">✅</div>
            <h2>Account Created!</h2>
            <p>
              Please check your email for a confirmation link. Redirecting you
              to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <p className="help-text">Minimum 6 characters</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create My Data Room"
              )}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
          <p style={{ marginTop: "1rem" }}>© 2026 SmallSend by ManishLapsus</p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
