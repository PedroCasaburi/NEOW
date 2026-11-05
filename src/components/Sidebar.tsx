import { Employee, Helmet } from "../types";
import { HardHat, Battery, Signal, AlertCircle, Cpu } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  employees: Employee[];
  helmets?: Helmet[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onIgnoreEmergency: (id: string) => void;
}

export default function Sidebar({ employees, helmets = [], selectedEmployeeId, onSelectEmployee, onIgnoreEmergency }: SidebarProps) {
  const resolveHelmetBadge = (emp: Employee) => {
    const matched = helmets.find(
      (h) =>
        (emp.assignedHelmetId && h.id.toLowerCase() === emp.assignedHelmetId.toLowerCase()) ||
        (emp.telemetry?.helmetId && h.id.toLowerCase() === emp.telemetry.helmetId.toLowerCase()) ||
        h.assignedEmployeeId === emp.id
    );
    const hId = matched?.id || emp.assignedHelmetId || emp.telemetry?.helmetId;
    const hSerial = matched?.serialNumber || emp.assignedHelmetSerial || emp.telemetry?.helmetSerial;
    if (!hId && !hSerial) return "Sem Capacete Vinculado";
    return hSerial && hSerial !== hId ? `${hId} (${hSerial})` : hId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE": return "bg-green-500";
      case "EMERGENCY": return "bg-red-500 animate-pulse";
      case "UNSTABLE": return "bg-yellow-500";
      case "OFFLINE": return "bg-zinc-500";
      default: return "bg-zinc-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ONLINE": return "text-green-400";
      case "EMERGENCY": return "text-red-400 font-bold";
      case "UNSTABLE": return "text-yellow-400";
      case "OFFLINE": return "text-zinc-400";
      default: return "text-zinc-400";
    }
  };

  return (
    <div className="w-80 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <HardHat className="w-6 h-6 text-yellow-500" />
          <h1 className="text-xl font-bold tracking-tight">Safety Monitor</h1>
        </div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Industrial Dashboard v1.0</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {employees.map((emp) => (
          <div key={emp.id} className="relative group">
            <button
              onClick={() => onSelectEmployee(emp.id)}
              className={cn(
                "w-full p-4 rounded-xl border transition-all text-left relative overflow-hidden",
                selectedEmployeeId === emp.id 
                  ? "bg-zinc-800 border-zinc-600 shadow-lg" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              {emp.status === "EMERGENCY" && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-zinc-100">{emp.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono">Operador: {emp.id}</p>
                  <p className="text-[10px] text-yellow-500/90 font-mono flex items-center gap-1 mt-1">
                    <Cpu className="w-3 h-3" />
                    <span>{resolveHelmetBadge(emp)}</span>
                  </p>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(emp.status))} />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Battery className={cn("w-3.5 h-3.5", emp.battery < 20 ? "text-red-500" : "text-zinc-500")} />
                  <span>{Math.round(emp.battery)}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Signal className="w-3.5 h-3.5 text-zinc-500" />
                  <span className={getStatusText(emp.status)}>{emp.status}</span>
                </div>
              </div>

              {emp.telemetry && (
                <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800 flex justify-between">
                  <span>Aceleração: <strong className="text-zinc-200">{emp.telemetry.aceleracaoG?.toFixed(1)}g</strong></span>
                  <span>Pontos: <strong className={(emp.telemetry.pontuacao ?? 0) >= 60 ? "text-red-400" : "text-green-400"}>{emp.telemetry.pontuacao ?? 0}/100</strong></span>
                </div>
              )}

              {emp.status === "EMERGENCY" && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-400 font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  <span>IMPACTO DETECTADO!</span>
                </div>
              )}
            </button>
            
            {emp.status === "EMERGENCY" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIgnoreEmergency(emp.id);
                }}
                className="absolute top-2 right-8 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                Ignorar
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          <span>Dispositivos Conectados</span>
          <span className="text-zinc-300">{employees.filter(e => e.status !== "OFFLINE").length}/{employees.length}</span>
        </div>
        <div className="w-full bg-zinc-900 h-1.5 mt-2 rounded-full overflow-hidden">
          <div 
            className="bg-yellow-500 h-full transition-all duration-500" 
            style={{ width: `${employees.length > 0 ? (employees.filter(e => e.status !== "OFFLINE").length / employees.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
