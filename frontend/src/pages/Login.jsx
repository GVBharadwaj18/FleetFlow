import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, User, Lock, Zap, ArrowRight, Eye, EyeOff } from "lucide-react";

function Login() {
  const [username, setUsername] = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("auth"));
    if (auth?.token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { username, passwordHash });
      const authData = { token: res.data.token, user: res.data.user };
      localStorage.setItem("auth", JSON.stringify(authData));
      login(authData);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-950 overflow-hidden">

      {/* ── Left: Brand Panel ────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-surface-1000 p-12">
        {/* Animated orb backgrounds */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px] animate-float-slow" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/15 blur-[100px] animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-brand-500/10 blur-[80px] animate-glow-pulse" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-xl tracking-tight">FleetOS</span>
            <p className="text-[10px] text-brand-300 uppercase tracking-widest font-medium">Vehicle Command Center</p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-5xl font-display font-black text-white leading-tight mb-6">
              Command Your<br />
              <span className="text-gradient-brand">Fleet with</span><br />
              Precision.
            </h1>
            <p className="text-surface-400 text-lg leading-relaxed max-w-md">
              Enterprise-grade vehicle management. Real-time dispatch, predictive maintenance, and comprehensive analytics — all in one platform.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap gap-3 mt-10"
          >
            {['Live Map Dispatch', 'AI Maintenance', 'Smart Invoicing', 'Real-time SOS'].map((feat, i) => (
              <span key={feat} className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-surface-300 text-sm rounded-full font-medium backdrop-blur-sm">
                {feat}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 grid grid-cols-3 gap-6"
        >
          {[
            { val: '99.9%', label: 'Uptime SLA' },
            { val: '500+', label: 'Fleets Managed' },
            { val: '< 50ms', label: 'API Response' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-display font-bold text-white">{s.val}</p>
              <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right: Login Form ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
        {/* Subtle background glow for mobile/light mode */}
        <div className="absolute inset-0 bg-mesh pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow-sm">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-surface-900 dark:text-white text-xl">FleetOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-surface-900 dark:text-white">Welcome back</h2>
            <p className="text-surface-500 mt-2">Sign in to your command center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="input-label">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input-modern pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordHash}
                  onChange={(e) => setPasswordHash(e.target.value)}
                  required
                  className="input-modern pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-4 py-3 bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-danger-200 dark:border-danger-500/20"
                >
                  <span className="w-1.5 h-1.5 bg-danger-500 rounded-full flex-shrink-0" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-base py-3 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
              Create account
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-8 px-4 py-3 bg-surface-100 dark:bg-surface-800/50 rounded-xl text-xs text-surface-500 dark:text-surface-400 text-center">
            <span className="font-medium text-surface-600 dark:text-surface-300">Demo:</span> Use your registered credentials to access the dashboard
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
