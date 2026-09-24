import React, { useState } from "react";
import { User, Lock, Mail, Phone, Briefcase, Hash, MapPin, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { formatCPF, formatPhone, isValidCPF, isValidPhone, isValidEmail } from "../utils/formatters";

interface RegisterProps {
  onRegister: (data: any) => Promise<{ success: boolean; message?: string }>;
  onGoBack: () => void;
}

export default function Register({ onRegister, onGoBack }: RegisterProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    cpf: "",
    position: "",
    department: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidCPF(formData.cpf)) {
      setError("CPF inválido segundo o algoritmo oficial. Verifique os dígitos.");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError("Endereço de e-mail com formato inválido.");
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError("Telefone incompleto. Digite DDD + número (mínimo 10 dígitos).");
      return;
    }
    if (formData.password.length < 4) {
      setError("A senha deve conter ao menos 4 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRegister(formData);
      if (!res.success) {
        setError(res.message || "Erro ao cadastrar. Tente outro nome de usuário.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro de conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === "cpf") {
      value = formatCPF(value);
    } else if (e.target.name === "phone") {
      value = formatPhone(value);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div 
      role="main"
      aria-label="Tela de Cadastro de Novo Usuário"
      className="relative min-h-screen w-full flex items-center justify-center p-4 py-8 overflow-y-auto bg-zinc-950"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-referrer"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=2070&auto=format&fit=crop')`,
          filter: 'brightness(0.6)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Register Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[600px] p-8 bg-[#1a1616]/95 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={onGoBack}
          className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-white tracking-tight">Safety Monitor</span>
          </div>
          
          <div className="w-full h-[1px] bg-white/10 mb-8" />
          
          <h2 className="text-3xl font-medium text-white mb-2">Cadastro de Usuário</h2>
          <p className="text-zinc-500 text-sm">Preencha os campos para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              name="firstName"
              placeholder="Nome"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          <div className="relative">
            <input
              type="text"
              name="lastName"
              placeholder="Sobrenome"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              name="username"
              placeholder="Nome de Usuário"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Hash className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              name="cpf"
              placeholder="CPF (000.000.000-00)"
              maxLength={14}
              value={formData.cpf}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-mono"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Briefcase className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              name="position"
              placeholder="Cargo"
              value={formData.position}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              name="department"
              placeholder="Setor / Bloco"
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Phone className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              name="phone"
              placeholder="Telefone ((11) 98765-4321)"
              maxLength={15}
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-mono"
              required
            />
          </div>

          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="password"
              name="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#2a2424] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium text-center md:col-span-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:col-span-2 bg-gradient-to-r from-[#f5c362] to-[#e8a845] hover:from-[#f7cd7d] hover:to-[#f0b55d] text-zinc-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-900/20 transition-all active:scale-[0.98] uppercase tracking-wider disabled:opacity-50"
          >
            {isSubmitting ? "CADASTRANDO..." : "CADASTRAR"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed">
            © 2026 Safety Monitor. Todos os direitos reservados.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
