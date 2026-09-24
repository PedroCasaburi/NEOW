import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Employee, UserRole } from "../types";
import { useEffect } from "react";
import { Activity, Radio, AlertTriangle, ShieldCheck, Wifi, MapPin } from "lucide-react";

// Custom Helmet Icon
const createHelmetIcon = (status: string) => {
  const color = status === "EMERGENCY" ? "#ef4444" : 
                status === "ONLINE" ? "#22c55e" : 
                status === "UNSTABLE" ? "#eab308" : "#71717a";

  return L.divIcon({
    className: `custom-helmet-icon ${status === "EMERGENCY" ? "emergency-pulse" : ""}`,
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15a8 8 0 0 1 16 0"/></svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

interface MapProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  userLocation: [number, number] | null;
  userRole?: UserRole;
}

export default function Map({ employees, selectedEmployeeId, onSelectEmployee, userLocation, userRole }: MapProps) {
  // Mostra no mapa EXCLUSIVAMENTE capacetes conectados
  const connectedEmployees = employees.filter(e => e.status !== "OFFLINE");
  const selectedEmployee = connectedEmployees.find(e => e.id === selectedEmployeeId) || connectedEmployees[0] || null;
  
  const center: [number, number] = selectedEmployee 
    ? [selectedEmployee.lat, selectedEmployee.lng] 
    : userLocation || [-23.5505, -46.6333];

  const userIcon = L.divIcon({
    className: "user-location-icon",
    html: `
      <div style="
        background-color: #3b82f6;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={center} 
        zoom={16} 
        scrollWheelZoom={true}
        className="z-0 w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="p-2 text-xs font-sans">
                <h3 className="font-bold text-zinc-900">Sua Localização</h3>
                <p className="text-zinc-600">Ponto Base Central</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Renderiza apenas capacetes conectados */}
        {connectedEmployees.map((emp) => (
          <Marker 
            key={emp.id} 
            position={[emp.lat, emp.lng]} 
            icon={createHelmetIcon(emp.status)}
            eventHandlers={{
              click: () => onSelectEmployee(emp.id),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px] text-zinc-900 font-sans">
                <div className="flex justify-between items-start border-b pb-1 mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">{emp.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">ID: {emp.id}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                    emp.status === "EMERGENCY" ? "bg-red-600" :
                    emp.status === "ONLINE" ? "bg-green-600" : "bg-yellow-600"
                  }`}>
                    {emp.status}
                  </span>
                </div>

                {emp.telemetry ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-700">
                      <span>Aceleração:</span>
                      <strong>{emp.telemetry.aceleracaoG?.toFixed(2)} G</strong>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>Pico Máximo:</span>
                      <strong>{emp.telemetry.picoG?.toFixed(2)} G</strong>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>Pontuação:</span>
                      <strong className={(emp.telemetry.pontuacao ?? 0) >= 60 ? "text-red-600" : "text-green-600"}>
                        {emp.telemetry.pontuacao ?? 0}/100
                      </strong>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>Som / Vibração:</span>
                      <span>
                        {emp.telemetry.som ? "Som Detectado" : "Silêncio"} | {emp.telemetry.vibracao ? "Vibração" : "Estável"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 pt-1 border-t">
                      <span>{userRole === "MASTER" ? "IP ESP32:" : "Conexão IoT:"}</span>
                      <span className="font-mono">{userRole === "MASTER" ? (emp.telemetry.ip || "192.168.0.122") : "Rede Protegida"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Sem telemetria registrada no momento.</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedEmployee && <MapUpdater center={[selectedEmployee.lat, selectedEmployee.lng]} />}
      </MapContainer>

      {/* Floating HUD Telemetry Overlay on Map */}
      {selectedEmployee && (
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-700/60 shadow-2xl text-white font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  selectedEmployee.status === "EMERGENCY" ? "bg-red-500 animate-pulse" :
                  selectedEmployee.status === "ONLINE" ? "bg-green-500" : "bg-yellow-500"
                }`} />
                <h3 className="font-bold text-sm text-zinc-100">{selectedEmployee.name}</h3>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Dispositivo: {selectedEmployee.id}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              selectedEmployee.status === "EMERGENCY" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              selectedEmployee.status === "ONLINE" ? "bg-green-500/20 text-green-400 border-green-500/30" :
              "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            }`}>
              {selectedEmployee.status}
            </span>
          </div>

          {selectedEmployee.telemetry ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Aceleração</span>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {selectedEmployee.telemetry.aceleracaoG?.toFixed(2)} <span className="text-xs text-yellow-500">G</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">Pico: {selectedEmployee.telemetry.picoG?.toFixed(2)}G</span>
                </div>

                <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Pontuação</span>
                  <div className={`text-lg font-bold mt-0.5 ${(selectedEmployee.telemetry.pontuacao ?? 0) >= 60 ? "text-red-400" : "text-green-400"}`}>
                    {selectedEmployee.telemetry.pontuacao ?? 0}<span className="text-xs text-zinc-500">/100</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    {(selectedEmployee.telemetry.pontuacao ?? 0) >= 60 ? "Crítico" : "Normal"}
                  </span>
                </div>
              </div>

              {/* Sensor Status */}
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-[10px] uppercase font-semibold">
                    {userRole === "MASTER" ? "Sensor Vibração (SW-420):" : "Sensor de Vibração:"}
                  </span>
                  <span className={`text-[10px] font-bold ${selectedEmployee.telemetry.vibracao ? "text-yellow-400" : "text-zinc-400"}`}>
                    {selectedEmployee.telemetry.vibracao ? "Vibração Ativa" : "Estável"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-[10px] uppercase font-semibold">
                    {userRole === "MASTER" ? "Sensor de Som (FC-04):" : "Sensor Acústico:"}
                  </span>
                  <span className={`text-[10px] font-bold ${selectedEmployee.telemetry.som ? "text-blue-400" : "text-zinc-400"}`}>
                    {selectedEmployee.telemetry.som ? "Som Detectado" : "Normal"}
                  </span>
                </div>
                {userRole === "MASTER" && (
                  <div className="flex justify-between items-center pt-1 border-t border-white/5">
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold">Wi-Fi / IP Local:</span>
                    <span className="text-[10px] font-mono text-zinc-300">
                      {selectedEmployee.telemetry.ip || "192.168.0.122"}
                    </span>
                  </div>
                )}
              </div>

              {/* GPS Coordinates */}
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-950/50 p-2 rounded-lg border border-white/5">
                <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <span className="truncate">
                  {selectedEmployee.telemetry.gpsValido 
                    ? `GPS: ${selectedEmployee.lat.toFixed(6)}, ${selectedEmployee.lng.toFixed(6)}`
                    : `Posição Base: ${selectedEmployee.lat.toFixed(4)}, ${selectedEmployee.lng.toFixed(4)}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-zinc-500">
              Aguardando telemetria inicial do capacete...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
