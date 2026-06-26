import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Brain, Upload, AlertTriangle,
  FileText, ExternalLink, ChevronDown, Loader2,
} from "lucide-react";
import axios from "../utils/axiosInstance";
import { useAuth } from "../context/useAuth";

// ─── Types ─────────────────────────────────────────────────────────────────────
// message: { id, role: "user"|"assistant", content, sources?, loading?, error? }

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400"
          animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </div>
  );
}

function SourceChip({ source }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-800/60 border border-surface-700/40 text-xs">
      <FileText className="w-3 h-3 text-brand-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold text-surface-300 truncate">{source.documentName}</p>
        <p className="text-surface-500 line-clamp-2 mt-0.5">{source.excerpt}</p>
        <p className="text-brand-500 mt-1">Relevance: {(source.relevance * 100).toFixed(0)}%</p>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-md"
            : "bg-surface-800/80 border border-surface-700/40 text-surface-100 rounded-bl-md"
        } ${msg.error ? "bg-danger-500/20 border-danger-400/30 text-danger-300" : ""}`}>
          {msg.loading ? <TypingDots /> : msg.content}
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowSources(s => !s)}
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              {msg.sources.length} source{msg.sources.length !== 1 ? "s" : ""}
              <ChevronDown className={`w-3 h-3 transition-transform ${showSources ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 mt-1.5 overflow-hidden"
                >
                  {msg.sources.map((s, i) => <SourceChip key={i} source={s} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Upload Button ─────────────────────────────────────────────────────────────
function UploadManualButton({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post("/api/ai/ingest-manual", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      });
      onUploaded(data);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-ghost text-xs py-1.5 px-3 gap-1.5"
        title="Upload vehicle manual PDF"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? "Uploading…" : "Upload Manual"}
      </button>
    </>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────
export default function RAGChatWidget() {
  const { auth } = useAuth();
  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm VMS-AI. Ask me anything about your vehicles or service manuals — e.g. \"Why is my engine overheating?\" or \"When should I replace brake pads?\"",
    },
  ]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [aiStatus,   setAiStatus]   = useState(null);
  const bottomRef = useRef();
  const inputRef  = useRef();

  const isAdmin = auth?.user?.role === "admin" || auth?.user?.role === "mechanic";

  useEffect(() => {
    axios.get("/api/ai/health").then(r => setAiStatus(r.data)).catch(() => setAiStatus({ available: false }));
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    setSending(true);

    const userMsg  = { id: Date.now().toString(), role: "user",      content: q };
    const thinkMsg = { id: "thinking",             role: "assistant", content: "", loading: true };
    setMessages(prev => [...prev, userMsg, thinkMsg]);

    try {
      const { data } = await axios.post("/api/ai/rag-query", { question: q, topK: 5 });
      setMessages(prev => prev.map(m =>
        m.id === "thinking"
          ? { id: Date.now().toString(), role: "assistant", content: data.answer, sources: data.sources }
          : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === "thinking"
          ? { id: Date.now().toString(), role: "assistant", content: "I couldn't reach the AI service. Please try again.", error: true }
          : m
      ));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onUploaded = (data) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: `✅ Manual uploaded! ${data.chunksIndexed} chunks indexed from "${data.documentName}". You can now ask questions about it.`,
    }]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        id="rag-chat-trigger"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-white shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        animate={{ boxShadow: open ? "0 0 32px rgba(100,56,255,0.6)" : "0 0 16px rgba(100,56,255,0.35)" }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"     initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><X        className="w-6 h-6" /></motion.div>
            : <motion.div key="brain" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><Brain className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{ opacity: 0, scale: 0.9,    y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[89] w-[380px] max-w-[calc(100vw-2rem)] bg-surface-950/95 backdrop-blur-xl border border-surface-800/80 rounded-2xl shadow-hard overflow-hidden flex flex-col"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800/60 bg-surface-900/50 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-display font-bold text-white">VMS-AI Assistant</p>
                <p className={`text-xs ${aiStatus?.available ? "text-success-400" : "text-surface-500"}`}>
                  {aiStatus?.available ? `● Online · ${aiStatus.chunksIndexed || 0} manual chunks` : "● AI Offline"}
                </p>
              </div>
              {isAdmin && <UploadManualButton onUploaded={onUploaded} />}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map(msg => <Message key={msg.id} msg={msg} />)}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 p-3 border-t border-surface-800/60 bg-surface-900/30 flex-shrink-0">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any vehicle issue…"
                className="flex-1 bg-surface-800/60 border border-surface-700/40 rounded-xl px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none min-h-[40px] max-h-32 overflow-y-auto"
                style={{ fieldSizing: "content" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center hover:shadow-glow-sm active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
