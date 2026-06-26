import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, User, Lock, Mail, Shield, ArrowRight, Zap, CheckCircle, Eye, EyeOff } from "lucide-react";

const ROLE_OPTIONS = [
  { value: 'user',     label: 'Customer',      desc: 'Book appointments, track your vehicles',    icon: User,   color: 'text-accent-500'   },
  { value: 'mechanic', label: 'Mechanic',       desc: 'Manage jobs, service vehicles, log work',   icon: Zap,    color: 'text-warning-500'  },
  { value: 'admin',    label: 'Administrator',  desc: 'Full access — dispatch, reports, settings', icon: Shield, color: 'text-brand-400'    },
];

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const [role, setRole] = useState("user");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", { username, email, passwordHash, role });
      const authData = { token: res.data.token, user: res.data.user };
      localStorage.setItem("auth", JSON.stringify(authData));
      login(authData);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-950 overflow-hidden">

      {/* ── Left: Brand Panel ────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-surface-1000 p-12">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent-500/15 blur-[120px] animate-float-slow" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-xl tracking-tight">FleetOS</span>
            <p className="text-[10px] text-brand-300 uppercase tracking-widest font-medium">Vehicle Command Center</p>
          </div>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-5xl font-display font-black text-white leading-tight mb-6">
              Join the<br />
              <span className="text-gradient-accent">Next-Gen</span><br />
              Fleet Platform.
            </h1>
            <p className="text-surface-400 text-lg leading-relaxed max-w-md">
              Choose your role to get started. Admins get full operational control, mechanics manage their jobs, and customers track their vehicles seamlessly.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10 space-y-4">
            {['No credit card required', 'Free during beta', 'Enterprise SSO available'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-surface-300">
                <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="relative z-10">
          <div className="h-px bg-gradient-to-r from-transparent via-surface-700 to-transparent mb-6" />
          <p className="text-surface-500 text-sm">Trusted by fleet operators across 12+ countries</p>
        </motion.div>
      </div>

      {/* ── Right: Register Form ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow-sm">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-surface-900 dark:text-white text-xl">FleetOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-display font-bold text-surface-900 dark:text-white">Create your account</h2>
            <p className="text-surface-500 mt-2">Get started with FleetOS in seconds</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="input-label">Select Your Role</label>
              <div className="grid grid-cols-1 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200
                      ${role === opt.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-600'
                      }`}
                  >
                    <opt.icon className={`w-5 h-5 flex-shrink-0 ${role === opt.value ? 'text-brand-500' : opt.color}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${role === opt.value ? 'text-brand-700 dark:text-brand-300' : 'text-surface-800 dark:text-surface-200'}`}>{opt.label}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {role === opt.value && <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="input-label">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required className="input-modern pl-10" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-modern pl-10" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={passwordHash} onChange={(e) => setPasswordHash(e.target.value)} required className="input-modern pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 px-4 py-3 bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm rounded-xl border border-danger-200 dark:border-danger-500/20">
                  <span className="w-1.5 h-1.5 bg-danger-500 rounded-full flex-shrink-0" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base py-3 mt-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating Account...
                </>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
