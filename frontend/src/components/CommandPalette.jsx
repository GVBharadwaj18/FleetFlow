import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Car, FileText, Wrench, Calendar, Brain, Map,
  ArrowRight, Zap, ChevronRight, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';

// ─── Static command definitions ────────────────────────────────────────────────
const STATIC_COMMANDS = [
  { type: 'Navigate',   text: 'Go to Dashboard',              icon: Zap,      path: '/dashboard'              },
  { type: 'Navigate',   text: 'My Vehicles',                  icon: Car,      path: '/vehicles'               },
  { type: 'Navigate',   text: 'Maintenance Records',          icon: Wrench,   path: '/maintenance'            },
  { type: 'Navigate',   text: 'Book a Service',               icon: Calendar, path: '/booking'                },
  { type: 'Navigate',   text: 'Fleet Intelligence Map',       icon: Map,      path: '/fleet-intelligence'     },
  { type: 'AI Action',  text: 'Predictive Maintenance Engine',icon: Brain,    path: '/predictive-maintenance' },
  { type: 'Navigate',   text: 'Invoices',                     icon: FileText, path: '/InvoicesPage'           },
  { type: 'Navigate',   text: 'Reports',                      icon: FileText, path: '/reports'                },
];

const TYPE_COLORS = {
  'AI Action':  'text-brand-400 bg-brand-500/15',
  'Navigate':   'text-surface-400 bg-surface-800',
  'Vehicle':    'text-accent-400  bg-accent-500/15',
  'Maintenance':'text-warning-400 bg-warning-500/15',
};

function useDebounce(value, delay) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

function CommandItem({ item, active, onClick }) {
  const Icon = item.icon || ArrowRight;
  const colorClass = TYPE_COLORS[item.type] || TYPE_COLORS.Navigate;
  return (
    <motion.button
      layout
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left group ${
        active ? 'bg-brand-500/15 ring-1 ring-brand-500/30' : 'hover:bg-surface-100 dark:hover:bg-surface-800/60'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{item.text}</p>
        <p className="text-xs text-surface-500 truncate">{item.subtext || item.type}</p>
      </div>
      <ChevronRight className={`w-4 h-4 text-surface-400 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
    </motion.button>
  );
}

export default function CommandPalette({ isOpen, setIsOpen }) {
  const [query,       setQuery]       = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveResults, setLiveResults] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const navigate = useNavigate();
  const inputRef  = useRef();
  const listRef   = useRef();
  const debouncedQuery = useDebounce(query, 300);

  // ── Global keyboard shortcut ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(o => !o); }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsOpen]);

  // ── Focus input when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── Live search: vehicles + maintenance ──────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setLiveResults([]);
      return;
    }
    setSearching(true);
    const q = debouncedQuery.toLowerCase();

    Promise.all([
      axios.get('/api/vehicles').catch(() => ({ data: [] })),
      axios.get('/api/maintenance').catch(() => ({ data: [] })),
    ]).then(([vRes, mRes]) => {
      const vehicles = (vRes.data || [])
        .filter(v => `${v.brand} ${v.model} ${v.plateNumber} ${v.year}`.toLowerCase().includes(q))
        .slice(0, 5)
        .map(v => ({
          type: 'Vehicle',
          text: `${v.brand} ${v.model} (${v.year})`,
          subtext: v.plateNumber,
          icon: Car,
          path: '/vehicles',
        }));

      const maintenance = (mRes.data || [])
        .filter(m => m.services?.some(s => s.description.toLowerCase().includes(q)) || m.vehicleId?.brand?.toLowerCase().includes(q))
        .slice(0, 3)
        .map(m => ({
          type: 'Maintenance',
          text: m.services?.[0]?.description || 'Maintenance Record',
          subtext: `${m.vehicleId?.brand || ''} ${m.vehicleId?.model || ''} — ${new Date(m.serviceDate).toLocaleDateString()}`,
          icon: Wrench,
          path: '/maintenance',
        }));

      setLiveResults([...vehicles, ...maintenance]);
    }).finally(() => setSearching(false));
  }, [debouncedQuery]);

  // ── Filtered static commands ──────────────────────────────────────────────
  const filtered = query.length < 2
    ? STATIC_COMMANDS
    : STATIC_COMMANDS.filter(c => c.text.toLowerCase().includes(query.toLowerCase()));

  const allItems = [...liveResults, ...filtered];

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && allItems[activeIndex]) {
      setIsOpen(false);
      navigate(allItems[activeIndex].path);
    }
  };

  // Reset active index when results change
  useEffect(() => setActiveIndex(0), [allItems.length]);

  const execute = useCallback((item) => {
    setIsOpen(false);
    navigate(item.path);
  }, [navigate, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -16 }}
        animate={{ opacity: 1, scale: 1,    y: 0   }}
        exit={{    opacity: 0, scale: 0.95, y: -16  }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-xl bg-white dark:bg-surface-900 rounded-2xl shadow-hard border border-surface-200 dark:border-surface-800 overflow-hidden"
        style={{ maxHeight: '75vh' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-surface-100 dark:border-surface-800">
          {searching
            ? <Loader2 className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" />
            : <Search className="w-5 h-5 text-brand-500 flex-shrink-0" />
          }
          <input
            id="command-palette-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search vehicles, commands, or ask AI…"
            className="w-full h-14 bg-transparent border-0 focus:ring-0 text-base text-surface-900 dark:text-surface-100 placeholder:text-surface-400 outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-xs font-semibold text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
          <div className="p-2 space-y-0.5">
            {/* Live search results */}
            {liveResults.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-xs font-bold text-surface-400 uppercase tracking-wider">Live Results</p>
                {liveResults.map((item, i) => (
                  <CommandItem key={`live-${i}`} item={item} active={activeIndex === i} onClick={() => execute(item)} />
                ))}
                <div className="border-t border-surface-100 dark:border-surface-800 my-1.5" />
              </>
            )}

            {/* Static / filtered commands */}
            {filtered.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-xs font-bold text-surface-400 uppercase tracking-wider">
                  {query ? 'Matching Commands' : 'Quick Actions'}
                  {!query && <span className="ml-2 badge badge-brand text-[10px] py-0.5 align-middle">Ctrl+K</span>}
                </p>
                {filtered.map((item, i) => {
                  const globalIdx = liveResults.length + i;
                  return (
                    <CommandItem key={`static-${i}`} item={item} active={activeIndex === globalIdx} onClick={() => execute(item)} />
                  );
                })}
              </>
            )}

            {allItems.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Brain className="w-8 h-8 mx-auto mb-3 text-brand-400 opacity-50" />
                <p className="text-sm text-surface-500">No results for "<span className="text-surface-800 dark:text-surface-200">{query}</span>"</p>
                <p className="text-xs text-surface-400 mt-1">Try the AI chat for vehicle-specific questions →</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-400">
          <span className="flex items-center gap-1"><kbd className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px]">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px]">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px]">esc</kbd> close</span>
        </div>
      </motion.div>
    </div>
  );
}
