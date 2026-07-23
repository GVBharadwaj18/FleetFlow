import React from 'react';
import { useAuth } from '../context/useAuth';
import { Shield, Wrench, Truck, UserCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleSwitcher() {
  const { auth, login } = useAuth();

  const DEMO_ROLES = [
    { role: 'admin', label: 'Fleet Manager (Admin)', icon: Shield, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', email: 'admin@fleetflow.com' },
    { role: 'mechanic', label: 'Senior Mechanic', icon: Wrench, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', email: 'mechanic@fleetflow.com' },
    { role: 'user', label: 'Fleet Driver / Customer', icon: Truck, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', email: 'driver@fleetflow.com' },
  ];

  const currentRole = auth?.user?.role || 'demo';

  const switchRole = (roleItem) => {
    // Generate simulated valid JWT session payload for instantaneous recruiter testing
    const demoPayload = {
      token: 'demo_token_' + Date.now(),
      user: {
        id: 'demo_user_' + roleItem.role,
        username: roleItem.label.split(' ')[0],
        email: roleItem.email,
        role: roleItem.role
      }
    };
    login(demoPayload);
    toast.success(`Switched role to: ${roleItem.label}`, {
      description: `Active role updated. RBAC permissions now set to ${roleItem.role.toUpperCase()}.`
    });
  };

  return (
    <div className="bg-brand-50/95 dark:bg-slate-900/90 backdrop-blur border-b border-brand-200/80 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-2 z-40 transition-colors">
      <div className="flex items-center gap-2 text-surface-800 dark:text-slate-300 font-medium">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
        </span>
        <span className="font-semibold text-surface-900 dark:text-slate-100 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Demo Recruiter Bar:
        </span>
        <span className="text-surface-600 dark:text-slate-400 hidden md:inline">Instantly test RBAC access levels</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {DEMO_ROLES.map((item) => {
          const Icon = item.icon;
          const isActive = currentRole === item.role;
          return (
            <button
              key={item.role}
              onClick={() => switchRole(item)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all border ${
                isActive
                  ? `${item.color} font-semibold ring-1 ring-brand-500/50 shadow-sm`
                  : 'bg-white dark:bg-slate-800/80 text-surface-700 dark:text-slate-400 border-surface-200 dark:border-slate-700 hover:text-surface-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {isActive && <UserCheck className="w-3 h-3 text-cyan-400 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
