import React, { useState, useEffect } from "react";
import { 
  FileCheck2, 
  X, 
  Download, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Gauge, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  BookOpen,
  Volume2,
  Cpu
} from "lucide-react";
import { SafetyGuideline, AccidentEvent, Employee, UserRole } from "../types";
import { dataService } from "../services/dataService";
import { motion } from "motion/react";

interface SafetyAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  userRole?: UserRole;
}

export default function SafetyAnalyticsModal({
  isOpen,
  onClose,
  employees,
  userRole
}: SafetyAnalyticsProps) {
  const [guidelines, setGuidelines] = useState<SafetyGuideline[]>([]);
  const [accidents, setAccidents] = useState<AccidentEvent[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"NORMAS" | "SENSORES" | "HISTORICO">("NORMAS");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const [guides, accs] = await Promise.all([
      dataService.getSafetyGuidelines(),
      dataService.getAccidents()
    ]);
    setGuidelines(guides);
    setAccidents(accs);
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const report = await dataService.generateTechnicalReport();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = userRole === "MASTER"
        ? `Laudo_Tecnico_Seguranca_Industrial_TCC_${new Date().toISOString().split("T")[0]}.json`
        : `Laudo_Tecnico_Conformidade_NR06_NR12_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar laudo:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {userRole === "MASTER" 
                    ? "Painel Analítico de Segurança & Normas (TCC)" 
                    : "Painel Analítico de Segurança & Conformidade (NR-06 / NR-12)"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30">
                  Em Conformidade
                </span>
              </div>
              <p className="text-xs text-zinc-400">Auditoria das normas regulamentadoras NR-06, NR-12 e análise de sensores biométricos/cinemáticos</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selection & Export Button */}
        <div className="p-4 px-6 border-b border-white/5 bg-zinc-900/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("NORMAS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "NORMAS" 
                  ? "bg-yellow-500 text-black shadow-lg" 
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Normas Regulamentadoras (NR)
            </button>
            <button
              onClick={() => setActiveTab("SENSORES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "SENSORES" 
                  ? "bg-yellow-500 text-black shadow-lg" 
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              <Cpu className="w-4 h-4" />
              Metodologia dos Sensores
            </button>
            <button
              onClick={() => setActiveTab("HISTORICO")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "HISTORICO" 
                  ? "bg-yellow-500 text-black shadow-lg" 
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Registro de Impactos ({accidents.length})
            </button>
          </div>

          <button
            onClick={handleExportReport}
            disabled={isExporting}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Gerando Laudo..." : "Exportar Laudo Técnico (JSON)"}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {/* TAB 1: NORMAS REGULAMENTADORAS */}
          {activeTab === "NORMAS" && (
            <div className="space-y-4">
              {userRole === "MASTER" ? (
                <div className="bg-zinc-950/70 p-4 rounded-xl border border-yellow-500/20 mb-4">
                  <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4" />
                    Fundamentação Legal e Técnica para Banca do TCC
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    O sistema atende diretamente às exigências legais da <strong>NR-06 (Equipamentos de Proteção Individual)</strong>, 
                    garantindo rastreabilidade do uso efetivo do capacete classe B e controle preventivo de calibração, além da 
                    <strong> NR-12 (Segurança no Trabalho em Máquinas e Equipamentos)</strong> ao permitir paradas de emergência e 
                    identificação de acidentes em milissegundos.
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-950/70 p-4 rounded-xl border border-green-500/20 mb-4">
                  <h3 className="text-sm font-bold text-green-400 flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Conformidade com Diretrizes MTE (NR-06 & NR-12)
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Monitoramento contínuo em conformidade com as exigências da <strong>NR-06 (EPI)</strong> para atenuação de impacto mecânico 
                    e uso obrigatório de capacete, bem como da <strong>NR-12 (Segurança em Máquinas)</strong> para resposta rápida em caso de colisão, 
                    queda de operador ou áreas de prensagem industrial.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guidelines.map((g) => (
                  <div key={g.id} className="bg-zinc-950/60 p-5 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {g.code}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">{g.title}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {g.complianceStatus}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {g.description}
                    </p>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Categoria: <strong className="text-zinc-400">{g.category}</strong></span>
                      <span>Auditoria: {new Date(g.lastAudit || Date.now()).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: METODOLOGIA DOS SENSORES */}
          {activeTab === "SENSORES" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MPU6050 */}
                <div className="bg-zinc-950/60 p-5 rounded-xl border border-white/5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {userRole === "MASTER" ? "MPU6050 (Acelerômetro & Giroscópio)" : "Sensor de Aceleração & Inclinação"}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Mede aceleração tridimensional (eixos X, Y, Z). Calcula a resultante vetorial:
                    <br />
                    <code className="text-yellow-400 font-mono text-[11px]">G = √(ax² + ay² + az²) / 9.80665</code>.
                    Dispara alerta grave caso o pico exceda <strong>4.0G</strong>.
                  </p>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400">
                    Peso na Pontuação: <strong>70%</strong>
                  </div>
                </div>

                {/* SW-420 */}
                <div className="bg-zinc-950/60 p-5 rounded-xl border border-white/5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {userRole === "MASTER" ? "SW-420 (Vibração Mecânica)" : "Sensor de Choque & Vibração Mecânica"}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sensor piezelétrico que detecta oscilações bruscas e impactos transversais diretos no casco do capacete, 
                    validando se o movimento foi uma queda real ou apenas inclinação.
                  </p>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400">
                    Peso na Pontuação: <strong>20%</strong>
                  </div>
                </div>

                {/* FC-04 */}
                <div className="bg-zinc-950/60 p-5 rounded-xl border border-white/5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {userRole === "MASTER" ? "FC-04 (Ruído Acústico)" : "Sensor de Alerta Acústico"}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Identifica estrondos mecânicos de colisão, rompimento de estruturas ou estampidos de impacto imediato
                    concomitante com a aceleração.
                  </p>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400">
                    Peso na Pontuação: <strong>10%</strong>
                  </div>
                </div>
              </div>

              {/* Fórmula de Risco */}
              <div className="bg-zinc-950/70 p-5 rounded-xl border border-white/10">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-yellow-500" />
                  {userRole === "MASTER" ? "Algoritmo de Cálculo de Pontuação de Risco (Score 0 a 100)" : "Índice de Risco Operacional em Tempo Real"}
                </h4>
                <div className="bg-zinc-900 p-3 rounded-lg font-mono text-xs text-yellow-400 border border-white/5">
                  Pontuação = (PontosMPU [0 a 70]) + (PontosVibracao [0 a 20]) + (PontosSom [0 a 10])
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs text-zinc-400">
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-green-400">
                    <strong>0 - 39:</strong> Operação Normal (Verde)
                  </div>
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                    <strong>40 - 59:</strong> Alerta Preventivo (Amarelo)
                  </div>
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                    <strong>60 - 100:</strong> EMERGÊNCIA CRÍTICA (Vermelho)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTRO DE IMPACTOS E OCORRÊNCIAS */}
          {activeTab === "HISTORICO" && (
            <div className="space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Data / Hora</th>
                    <th className="pb-3 px-3">Operador Afetado</th>
                    <th className="pb-3 px-3">Aceleração Força G</th>
                    <th className="pb-3 px-3">Pontuação</th>
                    <th className="pb-3 px-3">Sensores Ativos</th>
                    <th className="pb-3 px-3">Status de Atendimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-zinc-200">
                  {accidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        Nenhum impacto acidental registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    accidents.map((acc) => (
                      <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-3 font-mono text-zinc-400 text-[11px]">
                          {new Date(acc.timestamp).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-4 px-3 font-bold text-white">
                          {acc.employeeName} ({acc.employeeId})
                        </td>
                        <td className="py-4 px-3 font-mono text-yellow-400 font-bold">
                          {acc.aceleracaoG.toFixed(2)} G (Pico: {acc.picoG.toFixed(2)} G)
                        </td>
                        <td className="py-4 px-3">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                            acc.pontuacao >= 60 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {acc.pontuacao}/100
                          </span>
                        </td>
                        <td className="py-4 px-3 text-[11px] text-zinc-400">
                          {acc.vibracao ? "Vibração [SW-420] " : ""}
                          {acc.som ? "Som [FC-04]" : ""}
                        </td>
                        <td className="py-4 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            acc.acknowledged 
                              ? "bg-zinc-800 text-zinc-400" 
                              : "bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse"
                          }`}>
                            {acc.acknowledged ? "Reconhecido" : "Atendimento Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
