import React, { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Shield, CheckCircle, RefreshCw, AlertTriangle, Clock, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isValidEmail } from "../utils/formatters";
import { dataService } from "../services/dataService";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "EMAIL" | "OTP" | "SUCCESS";

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep("EMAIL");
      setEmail("");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccessMsg("");
      setCountdown(600);
      setResendCooldown(0);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
    };
  }, [isOpen]);

  // OTP countdown timer
  useEffect(() => {
    if (step === "OTP" && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      resendCooldownRef.current = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
      };
    }
  }, [resendCooldown]);

  // Redirect countdown after success
  useEffect(() => {
    if (step === "SUCCESS") {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onSuccess?.();
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRequestCode = async () => {
    if (!email || !isValidEmail(email)) {
      setError("Digite um endereço de e-mail válido.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await dataService.requestPasswordReset(email.trim());
      if (result.success) {
        setStep("OTP");
        setCountdown(600);
        setResendCooldown(45);
        setSuccessMsg(result.message || "Se o e-mail estiver cadastrado, um código foi enviado.");
        setTimeout(() => setSuccessMsg(""), 5000);
        setTimeout(() => otpInputRef.current?.focus(), 300);
      } else {
        setError(result.message || "Erro ao solicitar código.");
      }
    } catch {
      setError("Erro de conexão com o servidor. Verifique se o servidor está ativo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await dataService.requestPasswordReset(email.trim());
      if (result.success) {
        setCountdown(600);
        setResendCooldown(45);
        setOtpCode("");
        setSuccessMsg("Novo código enviado com sucesso.");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(result.message || "Erro ao reenviar código.");
      }
    } catch {
      setError("Erro ao reenviar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");

    if (!otpCode || otpCode.length !== 6) {
      setError("Digite o código de 6 dígitos recebido por e-mail.");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (countdown <= 0) {
      setError("Código expirado. Solicite um novo código.");
      return;
    }

    setLoading(true);
    try {
      const result = await dataService.resetPasswordWithOtp(email.trim(), otpCode, newPassword);
      if (result.success) {
        setStep("SUCCESS");
        setRedirectCountdown(3);
      } else {
        setError(result.message || "Código inválido ou expirado.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(digits);
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordStrength = newPassword.length >= 8 ? "Forte" : newPassword.length >= 6 ? "Média" : newPassword.length >= 4 ? "Fraca" : "";
  const passwordStrengthColor = newPassword.length >= 8 ? "text-green-400" : newPassword.length >= 6 ? "text-yellow-400" : "text-red-400";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[460px] bg-[#1a1616]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 bg-zinc-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Recuperação de Senha</h2>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {step === "EMAIL" && "Etapa 1 de 3 — Identificação"}
                  {step === "OTP" && "Etapa 2 de 3 — Verificação OTP"}
                  {step === "SUCCESS" && "Etapa 3 de 3 — Concluído"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-zinc-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {(["EMAIL", "OTP", "SUCCESS"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step === s ? "bg-yellow-500" :
                  (["EMAIL", "OTP", "SUCCESS"].indexOf(step) > i) ? "bg-yellow-500/60" : "bg-zinc-800"
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Email Input */}
            {step === "EMAIL" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <Mail className="w-12 h-12 text-yellow-500/60 mx-auto mb-3" />
                  <p className="text-sm text-zinc-300">
                    Digite o e-mail cadastrado no sistema. Enviaremos um código de verificação de <strong className="text-yellow-400">6 dígitos</strong>.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="seu.email@industrial.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleRequestCode()}
                    className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all text-sm"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {error}
                  </motion.p>
                )}

                {successMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-xs font-medium text-center">
                    {successMsg}
                  </motion.p>
                )}

                <button
                  onClick={handleRequestCode}
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-[#f5c362] to-[#e8a845] hover:from-[#f7cd7d] hover:to-[#f0b55d] text-zinc-900 font-bold py-3.5 rounded-xl shadow-lg shadow-yellow-900/20 transition-all active:scale-[0.98] uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    "Enviar Código de Verificação"
                  )}
                </button>
              </motion.div>
            )}

            {/* STEP 2: OTP + New Password */}
            {step === "OTP" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Timer & Status */}
                <div className="flex items-center justify-between bg-zinc-900/60 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${countdown > 60 ? "text-green-400" : countdown > 0 ? "text-yellow-400 animate-pulse" : "text-red-500"}`} />
                    <span className={`font-mono text-sm font-bold ${countdown > 60 ? "text-green-400" : countdown > 0 ? "text-yellow-400" : "text-red-500"}`}>
                      {formatTime(countdown)}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {countdown > 0 ? "Código válido" : "Código expirado"}
                  </span>
                </div>

                {/* OTP Code Input */}
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold uppercase tracking-wider text-[10px]">
                    Código de Verificação (6 dígitos)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <KeyRound className="w-5 h-5 text-yellow-500/60" />
                    </div>
                    <input
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otpCode}
                      onChange={e => handleOtpChange(e.target.value)}
                      maxLength={6}
                      className="w-full bg-[#2a2424] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-zinc-500">Verifique seu e-mail: <span className="text-zinc-300">{email}</span></p>
                    <button
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || loading}
                      className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 hover:text-yellow-400 disabled:text-zinc-600 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? "" : "hover:rotate-180 transition-transform"}`} />
                      {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : "Reenviar código"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold uppercase tracking-wider text-[10px]">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-zinc-500" />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p className={`text-[10px] mt-1 font-semibold ${passwordStrengthColor}`}>
                      Força: {passwordStrength}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-zinc-400 mb-2 font-semibold uppercase tracking-wider text-[10px]">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-zinc-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme a nova senha"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleResetPassword()}
                      className={`w-full bg-[#2a2424] border rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-all text-sm ${
                        confirmPassword
                          ? passwordsMatch
                            ? "border-green-500/40 focus:ring-green-500/50"
                            : "border-red-500/40 focus:ring-red-500/50"
                          : "border-white/5 focus:ring-yellow-500/50"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-red-400 text-[10px] mt-1 font-semibold">As senhas não coincidem.</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-green-400 text-[10px] mt-1 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Senhas coincidem
                    </p>
                  )}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {error}
                  </motion.p>
                )}

                {successMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-xs font-medium text-center">
                    {successMsg}
                  </motion.p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep("EMAIL"); setError(""); }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={loading || otpCode.length !== 6 || !newPassword || !passwordsMatch || countdown <= 0}
                    className="flex-[2] bg-gradient-to-r from-[#f5c362] to-[#e8a845] hover:from-[#f7cd7d] hover:to-[#f0b55d] text-zinc-900 font-bold py-3 rounded-xl shadow-lg shadow-yellow-900/20 transition-all active:scale-[0.98] uppercase tracking-wider text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Validando...</>
                    ) : (
                      "Redefinir Senha"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Success */}
            {step === "SUCCESS" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Senha Redefinida!</h3>
                  <p className="text-sm text-zinc-400">
                    Sua senha foi atualizada com sucesso. Todas as sessões ativas foram encerradas por segurança.
                  </p>
                </div>

                <div className="bg-zinc-900/60 rounded-xl p-3 border border-white/5">
                  <p className="text-[11px] text-zinc-400">
                    Redirecionando para o login em <span className="font-bold text-yellow-400">{redirectCountdown}s</span>...
                  </p>
                </div>

                <button
                  onClick={() => { onSuccess?.(); onClose(); }}
                  className="w-full bg-gradient-to-r from-[#f5c362] to-[#e8a845] text-zinc-900 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-wider text-xs"
                >
                  Ir para Login Agora
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 border-t border-white/5">
          <p className="text-[9px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
            Criptografia SHA-256 • Comparação Timing-Safe • OWASP Compliance
          </p>
        </div>
      </motion.div>
    </div>
  );
}
