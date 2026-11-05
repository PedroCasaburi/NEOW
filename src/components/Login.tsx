import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
  onGoToRegister: () => void;
  onForgotPassword?: () => void;
  error?: string;
  successMessage?: string;
}

export default function Login({ onLogin, onGoToRegister, onForgotPassword, error, successMessage }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div 
      role="main"
      aria-label="Tela de Autenticação Industrial"
      className="relative min-h-screen w-full flex items-center justify-center p-4 py-8 overflow-y-auto bg-zinc-950"
    >
      {/* Background Image */}
      <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=2070&auto=format&fit=crop')`,
          filter: 'brightness(0.6)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px] p-8 bg-[#1a1616]/90 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-white tracking-tight">Safety Monitor</span>
          </div>
          
          <div className="w-full h-[1px] bg-white/10 mb-6" />
          
          <h2 className="text-2xl font-medium text-white mb-2">Industrial Login</h2>
          <p className="text-xs text-zinc-400">Sistema de Monitoramento com Capacetes ESP32</p>
        </div>

        {/* Banner de Sucesso (ex: após redefinição de senha) */}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs text-center flex items-center justify-center gap-2"
          >
            <span>✓</span>
            <span>{successMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Nome de usuário ou email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all text-sm"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Link para recuperação de senha */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onForgotPassword?.();
              }}
              className="text-xs text-yellow-500/80 hover:text-yellow-400 transition-colors font-medium hover:underline cursor-pointer flex items-center gap-1 py-1 px-1"
            >
              <span>Esqueceu sua senha?</span>
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#f5c362] to-[#e8a845] hover:from-[#f7cd7d] hover:to-[#f0b55d] text-zinc-900 font-bold py-3.5 rounded-xl shadow-lg shadow-yellow-900/20 transition-all active:scale-[0.98] uppercase tracking-wider text-xs"
          >
            ENTRAR
          </button>
          
          <button
            type="button"
            onClick={onGoToRegister}
            className="w-full bg-transparent border border-white/20 hover:border-white/40 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider text-xs"
          >
            CADASTRAR
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
          <span>Autenticação RBAC Supabase • Sessão Persistente & Proteção contra Inatividade</span>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed">
            © 2026 Industrial Safety Monitor • ESP32 IoT
          </p>
        </div>
      </motion.div>
    </div>
  );
}
