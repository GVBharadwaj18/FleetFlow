import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Car, Wrench, FileText,
  Menu, X, Bell, Moon, Sun, Search, LogOut,
  ChevronLeft, Calendar, AlertTriangle, TrendingUp,
  Zap, Shield, MapPin, Activity, Brain, Map, Navigation, Code2
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import RAGChatWidget from './RAGChatWidget';
import RoleSwitcher from './RoleSwitcher';
import { useNotifications } from '../context/NotificationContext';

/* ── Theme helper — persists to localStorage + html class ── */
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('vms-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('vms-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return [isDark, () => setIsDark(v => !v)];
}

const SIDEBAR_LOGO = (
  <div className="flex items-center gap-3">
    <div className="relative w-9 h-9 flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-accent-500 rounded-xl shadow-glow-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className="w-5 h-5 text-white" fill="currentColor" />
      </div>
    </div>
    <div>
      <span className="font-display font-bold text-white tracking-tight leading-none block text-base">FleetFlow</span>
      <span className="text-[10px] text-brand-300 font-medium tracking-widest uppercase">Vehicle Command</span>
    </div>
  </div>
);

export default function AppShell({ children }) {
  const { auth, logout } = useAuth();
  const [isDark, toggleTheme] = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.role === 'mechanic';
  const userInitial = auth?.user?.username?.charAt(0).toUpperCase() || 'U';
  const roleLabel = auth?.user?.role === 'admin' ? 'Administrator' : auth?.user?.role === 'mechanic' ? 'Mechanic' : 'Customer';

  const navItems = [
    { name: 'Dashboard',   path: '/dashboard',          icon: LayoutDashboard, section: 'main' },
    { name: 'Live GPS Map', path: '/live-map',          icon: Navigation,      section: 'main', badge: 'live' },
    { name: 'Vehicles',    path: '/vehicles',            icon: Car,             section: 'main' },
    { name: 'Maintenance', path: '/maintenance',         icon: Wrench,          section: 'main' },
    { name: 'Invoices',    path: '/invoices',            icon: FileText,        section: 'main' },
    { name: 'API Explorer',path: '/api-docs',            icon: Code2,           section: 'main' },
    { name: 'Booking',     path: '/booking',             icon: Calendar,        section: 'main' },
    { name: 'Reports',     path: '/reports',             icon: TrendingUp,      section: 'main' },
    ...(isAdmin
      ? [{ name: 'Dispatch Center', path: '/dispatch',            icon: MapPin,          section: 'ops', badge: 'live' }]
      : [{ name: 'Emergency SOS',   path: '/request-assistance',  icon: AlertTriangle,   section: 'ops', badge: 'sos' }]),
    ...(auth?.user?.role === 'mechanic'
      ? [{ name: 'Assigned Jobs', path: '/assigned-jobs', icon: Shield, section: 'ops' }]
      : []),
    // AI Intelligence section (all authenticated users)
    { name: 'Fleet Intelligence',      path: '/fleet-intelligence',      icon: Map,   section: 'ai' },
    { name: 'Predictive Maintenance',  path: '/predictive-maintenance',  icon: Brain, section: 'ai', badge: 'ai' },
  ];

  const mainNav = navItems.filter(i => i.section === 'main');
  const opsNav  = navItems.filter(i => i.section === 'ops');
  const aiNav   = navItems.filter(i => i.section === 'ai');

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.path;
    const isDanger = item.badge === 'sos';
    const isLive   = item.badge === 'live';
    const isAI     = item.badge === 'ai';
    return (
      <NavLink
        to={item.path}
        title={!sidebarOpen ? item.name : undefined}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group
          ${isActive
            ? (isDanger ? 'text-danger-300 bg-danger-500/15' : 'text-white bg-brand-600/20')
            : (isDanger ? 'text-danger-500 hover:text-danger-300 hover:bg-danger-500/10' : 'text-surface-500 hover:text-surface-100 hover:bg-white/5')
          } ${!sidebarOpen ? 'justify-center' : ''}`}
      >
        {isActive && !isDanger && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-brand-400 to-accent-400 rounded-full shadow-glow-sm" />
        )}
        <div className="relative flex-shrink-0">
          <item.icon className={`w-5 h-5 transition-colors
            ${isActive ? (isDanger ? 'text-danger-400' : isAI ? 'text-accent-400' : 'text-brand-400') : (isDanger ? 'text-danger-500 group-hover:text-danger-300' : isAI ? 'text-surface-500 group-hover:text-accent-300' : 'text-surface-600 group-hover:text-surface-300')}`}
          />
          {isLive   && <span className="absolute -top-1 -right-1 w-2 h-2 bg-success-500 rounded-full border border-surface-950" />}
          {isDanger && <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger-500 rounded-full border border-surface-950" />}
          {isAI     && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-400 rounded-full border border-surface-950" />}
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 flex-1 whitespace-nowrap overflow-hidden"
            >
              <span>{item.name}</span>
              {isLive   && <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold tracking-widest bg-success-500/20 text-success-400 rounded uppercase">Live</span>}
              {isDanger && <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold tracking-widest bg-danger-500/20 text-danger-400 rounded uppercase">SOS</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex transition-colors duration-300">
      <CommandPalette isOpen={searchOpen} setIsOpen={setSearchOpen} />

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="hidden md:flex flex-col bg-surface-950 border-r border-surface-800/50 z-20 overflow-hidden flex-shrink-0"
        style={{ minHeight: '100vh' }}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-800/50 flex-shrink-0">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div key="logo-full" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                {SIDEBAR_LOGO}
              </motion.div>
            ) : (
              <motion.div key="logo-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-accent-500 rounded-xl shadow-glow-sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" fill="currentColor" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          <div className="space-y-0.5">
            {sidebarOpen && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-surface-600">Navigation</p>}
            {mainNav.map(item => <NavItem key={item.name} item={item} />)}
          </div>
          <div className="pt-4 space-y-0.5">
            {sidebarOpen && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-surface-600">Operations</p>}
            {opsNav.map(item => <NavItem key={item.name} item={item} />)}
          </div>
          <div className="pt-4 space-y-0.5">
            {sidebarOpen && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-accent-600 flex items-center gap-1.5">
                <Brain className="w-2.5 h-2.5" /> AI Intelligence
              </p>
            )}
            {aiNav.map(item => <NavItem key={item.name} item={item} />)}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-surface-800/50 flex-shrink-0">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div key="profile-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userInitial}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-100 truncate">{auth?.user?.username}</p>
                  <p className="text-[10px] text-surface-500 truncate">{roleLabel}</p>
                </div>
                <button onClick={logout} className="p-1.5 rounded-lg text-surface-600 hover:text-danger-400 hover:bg-danger-500/10 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="profile-collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">{userInitial}</div>
                <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-surface-600 hover:text-surface-200 hover:bg-white/5 transition-colors">
                  <Menu className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ── Main Content Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Recruiter Role Switcher Banner */}
        <RoleSwitcher />

        {/* Top Navbar */}
        <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/80 dark:border-surface-800/50 flex items-center justify-between px-4 lg:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-brand-500" />
              <span className="text-surface-400 dark:text-surface-500">FleetFlow</span>
              <span className="text-surface-300 dark:text-surface-600">/</span>
              <span className="font-semibold text-surface-700 dark:text-surface-200 capitalize">
                {location.pathname.slice(1).replace(/-/g, ' ') || 'Dashboard'}
              </span>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-all hover:border-brand-300 dark:hover:border-brand-700 ml-4"
              style={{ minWidth: 240 }}
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Search anything...</span>
              <kbd className="text-[10px] font-semibold bg-white dark:bg-surface-700 px-1.5 py-0.5 rounded border border-surface-200 dark:border-surface-600 text-surface-400">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-all"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Sun className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Moon className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100 transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white dark:border-surface-900" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-hard z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-brand-500" />
                          <span className="font-semibold text-surface-900 dark:text-surface-100 text-sm">Notifications</span>
                          {unreadCount > 0 && <span className="badge badge-brand">{unreadCount}</span>}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs font-medium text-brand-500 hover:text-brand-700 dark:text-brand-400 transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-surface-400">
                            <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif, idx) => (
                            <div key={idx} onClick={() => markAsRead(notif.id)} className={`p-4 cursor-pointer hover-surface ${notif.read ? 'opacity-60' : 'bg-brand-50/50 dark:bg-brand-900/10'}`}>
                              <div className="flex gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-surface-200 dark:bg-surface-700' : 'bg-brand-500'}`} />
                                <div>
                                  <p className="text-sm text-surface-800 dark:text-surface-200">{notif.message}</p>
                                  <p className="text-xs text-surface-400 mt-1">{notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString() : ''}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Sign Out Button in Top Navbar */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/15 border border-danger-200 dark:border-danger-500/30 hover:bg-danger-100 dark:hover:bg-danger-500/25 transition-all cursor-pointer ml-1"
              title="Sign Out of FleetFlow"
            >
              <LogOut className="w-3.5 h-3.5 text-danger-500" />
              <span>Sign Out</span>
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shadow-glow-sm ml-1" title={auth?.user?.username || 'User'}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-mesh">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── RAG Chat Widget (global floating) ── */}
      <RAGChatWidget />

      {/* ── Mobile Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-surface-950/70 backdrop-blur-sm z-40 md:hidden" />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-surface-950 z-50 flex flex-col md:hidden border-r border-surface-800/50"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-surface-800/50">
                {SIDEBAR_LOGO}
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl text-surface-500 hover:text-surface-200 hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink key={item.name} to={item.path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-colors ${isActive ? 'text-white bg-brand-600/20' : 'text-surface-400 hover:text-surface-100 hover:bg-white/5'}`}>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-surface-600'}`} />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-surface-800/50">
                <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-danger-400 hover:bg-danger-500/10 transition-colors text-sm font-medium">
                  <LogOut className="w-5 h-5" />Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
