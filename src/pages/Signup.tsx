import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../services/supabase";
import { Lock, Mail, CheckCircle2 } from "lucide-react";
import logo from "../assets/Deckly.png";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Card from "../components/common/Card";

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
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-deckly-background">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-deckly-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-deckly-secondary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <Card variant="glass" hoverable={false} className="p-8 md:p-10">
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div
              whileHover={{ rotate: 360, transition: { duration: 1 } }}
              className="w-20 h-20 bg-white/5 rounded-3xl p-4 mb-6 border border-white/10 shadow-2xl"
            >
              <img
                src={logo}
                alt="Deckly"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Join Deckly
            </h1>
            <p className="text-slate-400 font-medium text-sm">
              Start managing your private data rooms today
            </p>
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
                className="flex flex-col gap-5"
              >
                <Input
                  label="Business Email"
                  type="email"
                  placeholder="name@company.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Secure Password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                    At least 6 characters required
                  </p>
                </div>

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
                  className="mt-2"
                >
                  Create My Space
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-10 pt-8 border-t border-white/5 text-center flex flex-col gap-4">
            <p className="text-sm text-slate-400 font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-deckly-primary hover:text-deckly-primary/80 font-bold transition-colors"
              >
                Sign in
              </Link>
            </p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              © 2026 Deckly by Manish
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default Signup;
