import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../services/supabase";
import { Lock, Mail } from "lucide-react";
import logo from "../assets/Deckly.png";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Card from "../components/common/Card";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-deckly-background">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-deckly-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-deckly-secondary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
              Welcome Back
            </h1>
            <p className="text-slate-400 font-medium">
              Securely access your pitch data rooms
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-deckly-accent/10 border border-deckly-accent/20 text-deckly-accent text-xs font-bold p-3 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              fullWidth
              size="large"
              loading={loading}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center flex flex-col gap-4">
            <p className="text-sm text-slate-400 font-medium">
              New to Deckly?{" "}
              <Link
                to="/signup"
                className="text-deckly-primary hover:text-deckly-primary/80 font-bold transition-colors"
              >
                Create your space
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

export default Login;
