import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  ShieldCheck, 
  FileText, 
  X, 
  Edit3, 
  Check, 
  Calendar,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => Promise<boolean | { success: boolean; message?: string }>;
}

export default function ProfileModal({ isOpen, onClose, user, onUpdateUser }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  React.useEffect(() => {
    setFormData(user);
  }, [user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    const res = await onUpdateUser(formData);
    setSaving(false);
    if (res === true || (typeof res === "object" && res.success)) {
      setSuccessMsg(typeof res === "object" && res.message ? res.message : "Perfil atualizado e sincronizado no Supabase com sucesso!");
      setTimeout(() => {
        setSuccessMsg("");
        setIsEditing(false);
      }, 1500);
    } else {
      const err = typeof res === "object" && res.message ? res.message : "Erro ao atualizar dados no banco Supabase.";
      setErrorMsg(err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-white font-sans"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-yellow-500/50 flex items-center justify-center text-yellow-500 font-bold text-2xl shadow-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    user.role === "MASTER" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                    user.role === "COMPANY_ADMIN" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}>
                    {user.role === "MASTER" ? "Admin Master" : user.role === "COMPANY_ADMIN" ? "Admin Empresa" : "Visualizador"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">@{user.username}</p>
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Sessão Ativa no Safety Monitor</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-white/5"
                title={isEditing ? "Cancelar edição" : "Editar perfil"}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-green-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Primeiro Nome
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Telefone / Ramal
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-2 transition-all shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <User className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome Completo</span>
                      <p className="text-sm font-semibold text-zinc-100">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <FileText className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">CPF Registrado</span>
                      <p className="text-sm font-semibold text-zinc-100 font-mono">{user.cpf || "000.000.000-00"}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cargo / Posição</span>
                      <p className="text-sm font-semibold text-zinc-100">{user.position || "Administrador de Monitoramento"}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <Building className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Departamento</span>
                      <p className="text-sm font-semibold text-zinc-100">{user.department || "Centro de Operações (COI)"}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <Mail className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">E-mail</span>
                      <p className="text-sm font-semibold text-zinc-100 truncate">{user.email || "admin@safetymonitor.com"}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                    <Phone className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Telefone de Contato</span>
                      <p className="text-sm font-semibold text-zinc-100">{user.phone || "(11) 98765-4321"}</p>
                    </div>
                  </div>
                </div>

                {/* System Permissions Card */}
                <div className="bg-zinc-950/80 p-4 rounded-xl border border-yellow-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Permissões de Sistema</h4>
                      <p className="text-[11px] text-zinc-400">Nível 1 • Controle Total de Dispositivos e Alertas Críticos</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg">
                    Autorizado
                  </span>
                </div>

                {/* Footer Info */}
                <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Último acesso: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-wider transition-colors"
                  >
                    Editar Dados Pessoais
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
