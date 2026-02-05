import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../services/supabase";
import { Lock, Mail, CheckCircle2 } from "lucide-react";
import penguinMascot from "../assets/penguine.png";
import logo from "../assets/Deckly.png";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
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
        setTimeout(() => navigate("/login"), 4000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* Left Panel - Hero - Hidden on Mobile */}
      <div className="hidden md:flex md:w-5/12 bg-deckly-primary p-12 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-12"
        >
          <img
            src={penguinMascot}
            alt="Mascot"
            className="w-48 sm:w-64 md:w-80 h-auto object-contain"
          />
        </motion.div>
        <div className="max-w-md">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
            A pitchdeck management space build for founders and investors
          </h1>
          <p className="text-slate-800 text-lg font-semibold leading-relaxed">
            Free yourself from clutter of pitchdeck and focus on what matters
          </p>
        </div>
      </div>

      <div className="w-full md:w-7/12 bg-deckly-background p-8 md:p-24 flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 mb-8 flex items-center justify-center">
              <img
                src={logo}
                alt="Deckly"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Welcome to Deckly
            </h2>
            <p className="text-slate-500 font-bold mb-8">
              An all in one pitchdeck management workspace
            </p>

            {/* Social Logins */}
            <div className="w-full space-y-4 mb-8">
              <button className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold text-sm hover:bg-white/10 transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
                  />
                </svg>
                Continue with google
              </button>
              <button className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold text-sm hover:bg-white/10 transition-all">
                <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M17.05 20.28c-.96.95-2.26 1.11-3.66 1.11-1.31 0-2.31-.08-3.41-1.11C8.75 19.34 7 16.53 7 13.5c0-3.52 2.37-5.58 4.79-5.58 1.15 0 2.22.42 2.89.83.67.41 1.63.41 2.3 0 .67-.41 1.74-.83 2.89-.83 1.95 0 3.73 1.34 4.5 3.12-3.8 1.83-3.19 7.4.38 8.87-.58 1.48-1.55 2.82-2.73 3.96zM15.5 2c.07 1.51-.71 2.82-1.61 3.72-1.04.88-2.63 1.04-3.64.04-.15-1.44.75-2.88 1.62-3.84 1.02-.91 2.56-1.02 3.63.08z"
                  />
                </svg>
                Continue with apple
              </button>
            </div>

            <div className="flex items-center w-full gap-4 mb-8">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-600">
                Or Sign in With
              </span>
              <div className="h-px bg-white/5 flex-1" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div className="w-16 h-16 bg-deckly-primary/20 text-deckly-primary rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Check your email
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We've sent a confirmation link to <strong>{email}</strong>.
                  Redirecting to login shortly...
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignup}
                className="flex flex-col gap-6"
              >
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="password"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                {error && (
                  <div className="bg-deckly-accent/10 border border-deckly-accent/20 text-deckly-accent text-xs font-bold p-3 rounded-xl text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  loading={loading}
                  className="font-black tracking-widest uppercase py-4"
                >
                  Sign Up
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-bold">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-deckly-primary hover:text-deckly-primary/80 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          <p className="mt-12 text-[10px] text-slate-600 font-bold text-center leading-relaxed">
            By signing up you agree to our{" "}
            <span className="underline cursor-pointer">
              terms and conditions
            </span>{" "}
            and our{" "}
            <span className="underline cursor-pointer">privacy policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
