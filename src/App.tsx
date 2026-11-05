import { useEffect, useState, useRef, useCallback } from "react";
import { Employee, Helmet, WebSocketMessage, SystemStats, RecentActivity, UserProfile, UserRole } from "./types";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";
import VideoPlayer from "./components/VideoPlayer";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import HelmetManagementModal from "./components/HelmetManagementModal";
import EmployeeManagementModal from "./components/EmployeeManagementModal";
import UserManagementModal from "./components/UserManagementModal";
import SafetyAnalyticsModal from "./components/SafetyAnalyticsModal";
import CookieConsentBanner from "./components/CookieConsentBanner";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import {
  dataService,
  SESSION_STORAGE_KEY,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_WARNING_BEFORE_MS
} from "./services/dataService";
import { Bell, ArrowLeft, Users as UsersIcon, ShieldAlert, Clock, RefreshCw } from "lucide-react";

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [helmets, setHelmets] = useState<Helmet[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [authView, setAuthView] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("VIEWER");
  const [view, setView] = useState<"HOME" | "MAP">("HOME");
  const [loginError, setLoginError] = useState("");
  const [loginSuccessMessage, setLoginSuccessMessage] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Estado de monitoramento de inatividade da sessão (em segundos restantes quando em alerta)
  const [sessionRemainingSec, setSessionRemainingSec] = useState<number | null>(null);

  // Estados dos Modais do Sistema & LGPD
  const [showHelmetModal, setShowHelmetModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const [stats, setStats] = useState<SystemStats>({
    signalsToday: 0,
    emergenciesToday: 0,
    activeHelmets: 0,
    disconnectedHelmets: 0,
    systemStatus: "NOMINAL"
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    username: "",
    role: "VIEWER",
    cpf: "",
    position: "",
    department: "",
    email: "",
    phone: ""
  });

  const ws = useRef<WebSocket | null>(null);
  const lastActivityTouchRef = useRef<number>(0);

  // Função auxiliar para encerrar sessão com motivo opcional de segurança/inatividade
  const forceLogoutWithReason = useCallback((reason?: string) => {
    dataService.clearSession(reason || "Logout do usuário");
    setIsAuthenticated(false);
    setUsername("");
    setUserRole("VIEWER");
    setView("HOME");
    setSelectedEmployeeId(null);
    setSessionRemainingSec(null);
    if (reason) {
      setLoginError(reason);
      setLoginSuccessMessage("");
    }
  }, []);

  // 1. Restauração e Validação de Sessão Persistente ao Recarregar Página (Ctrl+R / F5)
  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      try {
        const result = await dataService.validateAndRestoreSession();
        if (!mounted) return;

        if (result.valid && result.session) {
          setIsAuthenticated(true);
          setUsername(result.session.username);
          setUserRole(result.session.role);
          setCurrentUser(result.session.user);
          setLoginError("");
        } else if (result.expiredReason) {
          setIsAuthenticated(false);
          setLoginError(result.expiredReason);
        }
      } catch (err) {
        console.error("[Sessão] Erro ao restaurar sessão:", err);
      } finally {
        if (mounted) {
          setIsRestoringSession(false);
        }
      }
    };
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Metodologias Múltiplas de Inatividade, Segurança de Sessão e Sincronização Entre Abas
  useEffect(() => {
    if (!isAuthenticated) {
      setSessionRemainingSec(null);
      return;
    }

    // Metodologia A: Monitoramento de eventos de interação humana no DOM (throttled a cada 5s)
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityTouchRef.current >= 5000) {
        lastActivityTouchRef.current = now;
        void dataService.touchSessionActivity();
      }
      setSessionRemainingSec(null);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Metodologia B: Verificação contínua de tempo ocioso (Idle Timeout) e limite absoluto de turno
    const idleCheckInterval = setInterval(() => {
      const session = dataService.getStoredSession();
      if (!session) {
        forceLogoutWithReason("Sua sessão foi encerrada ou removida.");
        return;
      }

      const now = Date.now();
      const idleElapsed = now - session.lastActivityAt;
      const remainingMs = SESSION_IDLE_TIMEOUT_MS - idleElapsed;

      if (remainingMs <= 0) {
        forceLogoutWithReason("Sessão encerrada automaticamente por inatividade (15 minutos sem interação).");
        return;
      }

      if (remainingMs <= SESSION_WARNING_BEFORE_MS) {
        setSessionRemainingSec(Math.max(1, Math.ceil(remainingMs / 1000)));
      } else {
        setSessionRemainingSec(null);
      }
    }, 1000);

    // Metodologia C: Revalidação Criptográfica (SHA-256) e Verificação RBAC / Token Version no Supabase a cada 15s
    const cloudValidationInterval = setInterval(async () => {
      const check = await dataService.validateAndRestoreSession();
      if (!check.valid) {
        forceLogoutWithReason(check.expiredReason || "Sessão invalidada pelo controle de segurança RBAC.");
        return;
      }
      if (check.session) {
        if (check.session.role !== userRole) {
          setUserRole(check.session.role);
        }
        setCurrentUser(check.session.user);
      }
    }, 15000);

    // Metodologia D: Revalidação imediata ao retornar o foco para a aba/janela (Visibility & Focus)
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === "visible") {
        const check = await dataService.validateAndRestoreSession();
        if (!check.valid) {
          forceLogoutWithReason(check.expiredReason || "Sessão expirada durante ausência da aba.");
        } else if (check.session) {
          setUserRole(check.session.role);
          setCurrentUser(check.session.user);
        }
      }
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    // Metodologia E: Sincronização Multi-Abas via Storage Event (Logout ou atividade em outra aba)
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY) {
        if (!event.newValue) {
          setIsAuthenticated(false);
          setUsername("");
          setUserRole("VIEWER");
          setLoginError("Sessão encerrada em outra aba do navegador.");
        } else {
          try {
            const updatedSession = JSON.parse(event.newValue);
            if (updatedSession?.role && updatedSession.role !== userRole) {
              setUserRole(updatedSession.role);
            }
          } catch {}
        }
      }
    };
    window.addEventListener("storage", handleStorageSync);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(idleCheckInterval);
      clearInterval(cloudValidationInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("storage", handleStorageSync);
    };
  }, [isAuthenticated, userRole, forceLogoutWithReason]);

  // Função para carregar funcionários e capacetes reais do Supabase (sem SEED DATA)
  const reloadEmployeesAndHelmets = useCallback(async () => {
    const [initialEmps, initialHelmets] = await Promise.all([
      dataService.getEmployees(),
      dataService.getHelmets()
    ]);

    setHelmets(initialHelmets || []);
    setEmployees((prev) => {
      // Preserva telemetria em tempo real já recebida de ESP32 ativos ao recarregar metadados do banco
      const merged = (initialEmps || []).map((emp) => {
        const existing = prev.find((p) => p.id === emp.id);
        const linkedHelmet = (initialHelmets || []).find(
          (h) => h.id === emp.assignedHelmetId || h.assignedEmployeeId === emp.id
        );
        return {
          ...emp,
          assignedHelmetId: emp.assignedHelmetId || linkedHelmet?.id,
          assignedHelmetSerial: emp.assignedHelmetSerial || linkedHelmet?.serialNumber,
          status: existing && existing.status !== "OFFLINE" ? existing.status : emp.status,
          telemetry: existing?.telemetry || emp.telemetry
        };
      });

      // Mantém eventuais dispositivos ESP32 autodetectados em execução que ainda não foram salvos na tabela employees
      const dynamicDevices = prev.filter(
        (p) => p.status !== "OFFLINE" && !merged.some((m) => m.id === p.id)
      );
      return [...merged, ...dynamicDevices];
    });
  }, []);

  // Carrega lista inicial de funcionários e capacetes do dataService (Supabase)
  useEffect(() => {
    reloadEmployeesAndHelmets();
  }, [reloadEmployeesAndHelmets]);

  // Atualiza contadores reais de capacetes ativos e desconectados sempre que employees ou helmets mudam
  useEffect(() => {
    const activeCount = employees.filter((e) => e.status !== "OFFLINE").length;
    const totalRegisteredHelmets = Math.max(helmets.length, employees.length);
    const disconnectedCount = Math.max(0, totalRegisteredHelmets - activeCount);

    setStats((prev) => ({
      ...prev,
      activeHelmets: activeCount,
      disconnectedHelmets: disconnectedCount
    }));

    if (!selectedEmployeeId && employees.length > 0) {
      const firstOnline = employees.find((e) => e.status !== "OFFLINE");
      setSelectedEmployeeId((firstOnline || employees[0]).id);
    }
  }, [employees, helmets, selectedEmployeeId]);

  // Sincronização Bidirecional em Tempo Real com Supabase
  useEffect(() => {
    const unsubscribe = dataService.subscribeToRealtime((table, event, record) => {
      console.log(`[Supabase Realtime Sync] Tabela: ${table}, Evento: ${event}`, record);

      if (table === "employees" || table === "helmets") {
        reloadEmployeesAndHelmets();
      } else if (table === "users") {
        // Se for atualização do usuário atual, sincronizar permissões RBAC, status ativo e dados de perfil ao vivo
        if (record && record.username?.toLowerCase() === username?.toLowerCase()) {
          if (record.active === false) {
            forceLogoutWithReason("Sua conta foi desativada pelo Administrador no banco de dados (RBAC).");
            return;
          }
          if (record.role && record.role !== userRole) {
            setUserRole(record.role);
          }
          setCurrentUser((prev) => ({
            ...prev,
            firstName: record.firstName !== undefined ? record.firstName : prev.firstName,
            lastName: record.lastName !== undefined ? record.lastName : prev.lastName,
            role: record.role || prev.role,
            cpf: record.cpf !== undefined ? record.cpf : prev.cpf,
            position: record.position !== undefined ? record.position : prev.position,
            department: record.department !== undefined ? record.department : prev.department,
            email: record.email !== undefined ? record.email : prev.email,
            phone: record.phone !== undefined ? record.phone : prev.phone
          }));
        }
      } else if (table === "accident_events" && event === "INSERT") {
        setStats((prev) => ({
          ...prev,
          emergenciesToday: prev.emergenciesToday + 1,
          systemStatus: "EMERGENCY"
        }));
        setActivities((prev) => [
          {
            id: `realtime-acc-${Date.now()}`,
            title: "Alerta de Impacto (Supabase Cloud)",
            description: `Impacto detectado em ${record.employeeName || "Operador"} (${record.aceleracaoG}g)`,
            timestamp: Date.now(),
            type: "EMERGENCY",
            employeeName: record.employeeName,
            employeeId: record.employeeId
          },
          ...prev.slice(0, 19)
        ]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [username, userRole, reloadEmployeesAndHelmets, forceLogoutWithReason]);

  // Função inteligente para aplicar pacote de telemetria de um ou múltiplos ESP32 ao operador e capacete correspondentes
  const applyIncomingEspDevices = useCallback((rawDevices: any[]) => {
    if (!rawDevices || rawDevices.length === 0) return;

    setEmployees((prevEmployees) => {
      const updatedList = [...prevEmployees];

      for (const dados of rawDevices) {
        if (!dados || (dados.aceleracaoG === undefined && !dados.wifi && !dados.ip)) continue;

        const payloadEmpId = (dados.employeeId || dados.operatorId || "").trim();
        const payloadHelmetId = (dados.helmetId || dados.capaceteId || "").trim();
        const payloadSerial = (dados.serialNumber || dados.helmetSerial || "").trim();
        const payloadMac = (dados.macAddress || dados.mac || "").trim().toUpperCase();
        const payloadIp = (dados.ip || "").trim();

        // 1. Localiza capacete correspondente no cadastro de capacetes
        const matchedHelmet = helmets.find(
          (h) =>
            (payloadHelmetId && h.id.toLowerCase() === payloadHelmetId.toLowerCase()) ||
            (payloadSerial && h.serialNumber.toLowerCase() === payloadSerial.toLowerCase()) ||
            (payloadMac && (h.macAddress || "").toUpperCase() === payloadMac)
        );

        // 2. Localiza operador correspondente na lista
        let targetIdx = -1;
        if (payloadEmpId) {
          targetIdx = updatedList.findIndex((e) => e.id.toLowerCase() === payloadEmpId.toLowerCase());
        }
        if (targetIdx === -1 && matchedHelmet) {
          targetIdx = updatedList.findIndex(
            (e) =>
              e.assignedHelmetId === matchedHelmet.id ||
              e.id === matchedHelmet.assignedEmployeeId
          );
        }
        if (targetIdx === -1 && payloadHelmetId) {
          targetIdx = updatedList.findIndex(
            (e) => (e.assignedHelmetId || "").toLowerCase() === payloadHelmetId.toLowerCase()
          );
        }
        if (targetIdx === -1 && payloadMac) {
          targetIdx = updatedList.findIndex(
            (e) => (e.telemetry?.macAddress || "").toUpperCase() === payloadMac
          );
        }
        if (targetIdx === -1 && payloadIp) {
          targetIdx = updatedList.findIndex((e) => e.telemetry?.ip === payloadIp);
        }

        // Se não tinha vínculo prévio de IP/MAC, vincula ao primeiro operador que ainda não possui outro IP ativo diferente
        if (targetIdx === -1 && updatedList.length > 0) {
          targetIdx = updatedList.findIndex(
            (e) => !e.telemetry?.ip || e.telemetry.ip === payloadIp || e.status === "OFFLINE"
          );
        }

        const isImpact =
          dados.impacto === true || dados.impacto === "true" || Number(dados.pontuacao) >= 60;
        const latVal =
          typeof dados.latitude === "number" ? dados.latitude : parseFloat(dados.latitude);
        const lngVal =
          typeof dados.longitude === "number" ? dados.longitude : parseFloat(dados.longitude);
        const hasValidGps =
          (dados.gpsValido === true || dados.gpsValido === "true") &&
          !isNaN(latVal) &&
          !isNaN(lngVal) &&
          (latVal !== 0 || lngVal !== 0);

        const resolvedHelmetId =
          matchedHelmet?.id ||
          payloadHelmetId ||
          (targetIdx !== -1 ? updatedList[targetIdx].assignedHelmetId : undefined) ||
          `ESP-${(payloadMac || payloadIp || "NODE").slice(-5).replace(/[^a-zA-Z0-9]/g, "")}`;

        const resolvedHelmetSerial =
          matchedHelmet?.serialNumber ||
          payloadSerial ||
          (targetIdx !== -1 ? updatedList[targetIdx].assignedHelmetSerial : undefined) ||
          resolvedHelmetId;

        const resolvedMac = payloadMac || matchedHelmet?.macAddress || "";

        const builtTelemetry = {
          aceleracao: Number(dados.aceleracao) || 0,
          aceleracaoG: Number(dados.aceleracaoG) || 0,
          picoAceleracaoG: Number(dados.picoAceleracaoG) || Number(dados.picoG) || 0,
          picoG: Number(dados.picoG) || Number(dados.picoAceleracaoG) || 0,
          giroscopioGraus: Number(dados.giroscopioGraus) || 0,
          pontuacao: Number(dados.pontuacao) || 0,
          pontosMPU: Number(dados.pontosMPU) || 0,
          pontosVibracao: Number(dados.pontosVibracao) || 0,
          pontosSom: Number(dados.pontosSom) || 0,
          vibracao: dados.vibracao === true || dados.vibracao === "true",
          som: dados.som === true || dados.som === "true",
          wifi: dados.wifi || "CONECTADO",
          ip: payloadIp,
          macAddress: resolvedMac,
          helmetId: resolvedHelmetId,
          helmetSerial: resolvedHelmetSerial,
          deviceId: dados.deviceId || resolvedHelmetId,
          satelites: Number(dados.satelites) || 0,
          altitude: Number(dados.altitude) || 0,
          hdop: Number(dados.hdop) || 0,
          gpsValido: dados.gpsValido === true || dados.gpsValido === "true",
          mapsUrl: dados.mapsUrl || ""
        };

        if (targetIdx !== -1) {
          const emp = updatedList[targetIdx];
          updatedList[targetIdx] = {
            ...emp,
            assignedHelmetId: emp.assignedHelmetId || matchedHelmet?.id || resolvedHelmetId,
            assignedHelmetSerial: emp.assignedHelmetSerial || matchedHelmet?.serialNumber || resolvedHelmetSerial,
            status: isImpact ? "EMERGENCY" : emp.status === "EMERGENCY" ? "EMERGENCY" : "ONLINE",
            lat: hasValidGps ? latVal : emp.lat,
            lng: hasValidGps ? lngVal : emp.lng,
            lastSeen: Date.now(),
            telemetry: {
              ...emp.telemetry,
              ...builtTelemetry
            }
          };
        } else {
          // Caso um segundo/terceiro ESP32 envie dados e todos os operadores cadastrados já estejam ocupados com outros IPs/MACs
          const dynamicId =
            payloadEmpId ||
            matchedHelmet?.assignedEmployeeId ||
            `ESP-${updatedList.length + 1}`;
          updatedList.push({
            id: dynamicId,
            name: dados.employeeName || `Operador IoT (${resolvedHelmetId})`,
            roleFunction: "Operador Monitorado (Auto-Descoberta ESP32)",
            department: "Telemetria em Campo",
            status: isImpact ? "EMERGENCY" : "ONLINE",
            lat: hasValidGps ? latVal : userLocation?.[0] ?? -23.5505,
            lng: hasValidGps ? lngVal : userLocation?.[1] ?? -46.6333,
            lastSeen: Date.now(),
            battery: matchedHelmet?.battery ?? 100,
            assignedHelmetId: resolvedHelmetId,
            assignedHelmetSerial: resolvedHelmetSerial,
            telemetry: builtTelemetry
          });
        }
      }

      return updatedList;
    });
  }, [helmets, userLocation]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Obter localização do usuário
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "SET_BASE_LOCATION", lat: latitude, lng: longitude }));
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }

    let isSubscribed = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    // Suporte a VITE_API_URL para deploy no Vercel e túnel ngrok
    const apiBaseUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
    let wsUrl: string;
    if (apiBaseUrl) {
      const baseWs = apiBaseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
      wsUrl = baseWs.includes("ngrok")
        ? `${baseWs}?ngrok-skip-browser-warning=true`
        : baseWs;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      wsUrl = `${protocol}//${host}`;
    }

    const connectWebSocket = () => {
      if (!isSubscribed) return;
      try {
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          if (userLocation) {
            ws.current?.send(JSON.stringify({ type: "SET_BASE_LOCATION", lat: userLocation[0], lng: userLocation[1] }));
          }
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (message.type === "INITIAL_STATE" || message.type === "UPDATE") {
              if (Array.isArray(message.data) && message.data.length > 0) {
                setEmployees((prev) => {
                  const mapById = new globalThis.Map<string, Employee>();
                  prev.forEach((p) => mapById.set(p.id, p));
                  message.data.forEach((inc) => {
                    const existing = mapById.get(inc.id);
                    mapById.set(inc.id, {
                      ...(existing || {}),
                      ...inc,
                      assignedHelmetId: inc.assignedHelmetId || existing?.assignedHelmetId,
                      assignedHelmetSerial: inc.assignedHelmetSerial || existing?.assignedHelmetSerial,
                      telemetry: inc.telemetry || existing?.telemetry
                    });
                  });
                  return Array.from(mapById.values());
                });
              }
              if (message.stats) {
                setStats((prev) => ({
                  ...prev,
                  signalsToday: message.stats!.signalsToday ?? prev.signalsToday,
                  emergenciesToday: message.stats!.emergenciesToday ?? prev.emergenciesToday,
                  systemStatus: message.stats!.systemStatus ?? prev.systemStatus
                }));
              }
              if (message.activities && message.activities.length > 0) {
                setActivities(message.activities);
              }
            }
          } catch (err) {
            console.error("Erro ao processar mensagem do WebSocket", err);
          }
        };

        ws.current.onclose = () => {
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.current.onerror = () => {
          ws.current?.close();
        };
      } catch {
        console.info("WebSocket não disponível no momento. Operando via polling HTTP contínuo.");
      }
    };

    connectWebSocket();

    // Fallback de polling HTTP para garantir telemetria contínua de múltiplos ESP32 mesmo se o WebSocket oscilar no Vercel / ngrok
    const pollingInterval = setInterval(async () => {
      if (!isSubscribed) return;
      try {
        const targetUrl = apiBaseUrl || "";
        const [dadosRes, statsRes] = await Promise.all([
          fetch(`${targetUrl}/api/dados`, {
            headers: { "ngrok-skip-browser-warning": "true" },
            signal: AbortSignal.timeout(2000)
          }).catch(() => null),
          fetch(`${targetUrl}/api/stats`, {
            headers: { "ngrok-skip-browser-warning": "true" },
            signal: AbortSignal.timeout(2000)
          }).catch(() => null)
        ]);

        if (dadosRes && dadosRes.ok) {
          const dados = await dadosRes.json();
          if (dados) {
            if (Array.isArray(dados.devices) && dados.devices.length > 0) {
              applyIncomingEspDevices(dados.devices);
            } else if (dados.aceleracaoG !== undefined || dados.wifi) {
              applyIncomingEspDevices([dados]);
            }
          }
        }

        if (statsRes && statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData && statsData.signalsToday !== undefined) {
            setStats((prev) => ({
              ...prev,
              signalsToday: statsData.signalsToday,
              emergenciesToday: statsData.emergenciesToday ?? prev.emergenciesToday,
              systemStatus: statsData.systemStatus ?? prev.systemStatus
            }));
          }
        }
      } catch {
        // Silencioso em caso de falha transitória de rede
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollingInterval);
      ws.current?.close();
    };
  }, [isAuthenticated, applyIncomingEspDevices, userLocation]);

  const handleLogin = async (user: string, pass: string) => {
    // 1. Autenticação no serviço unificado (Supabase com RBAC + Sessão Assinada)
    const authRes = await dataService.authenticate(user, pass);
    if (authRes.success && authRes.user) {
      setIsAuthenticated(true);
      setUsername(authRes.user.username);
      setUserRole(authRes.role || "VIEWER");
      setCurrentUser(authRes.user);
      setLoginError("");
      setLoginSuccessMessage("");
      setShowForgotPasswordModal(false);
      return;
    }

    // 2. Fallback para API do servidor backend caso esteja rodando
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        const loggedProfile: UserProfile = {
          id: data.user.id,
          firstName: data.user.firstName || data.user.username,
          lastName: data.user.lastName || "",
          username: data.user.username || user,
          role: data.user.role || "VIEWER",
          cpf: data.user.cpf || "",
          position: data.user.position || "",
          department: data.user.department || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          active: true,
          tokenVersion: data.user.tokenVersion || 1
        };
        await dataService.createSession(loggedProfile, loggedProfile.tokenVersion || 1);
        setIsAuthenticated(true);
        setUsername(loggedProfile.username);
        setUserRole(loggedProfile.role);
        setCurrentUser(loggedProfile);
        setLoginError("");
        setLoginSuccessMessage("");
        setShowForgotPasswordModal(false);
        return;
      }
    } catch {}

    setLoginError(authRes.message || "Usuário ou senha incorretos.");
  };

  const handleUpdateUser = async (updated: UserProfile): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await dataService.saveUser(updated, currentUser.username);
      if (res.success) {
        setCurrentUser(updated);
        setUsername(updated.username);
        await dataService.createSession(updated, updated.tokenVersion || 1);
        return { success: true, message: res.message || "Perfil atualizado e sincronizado com o Supabase com sucesso!" };
      } else {
        return { success: false, message: res.message || "Erro ao atualizar perfil no Supabase." };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || "Falha ao processar atualização do perfil." };
    }
  };

  const handleRegister = async (userData: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await dataService.saveUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password: userData.password,
        role: "VIEWER",
        cpf: userData.cpf,
        position: userData.position,
        department: userData.department,
        email: userData.email,
        phone: userData.phone,
        active: true
      }, "register");

      if (res.success) {
        setAuthView("LOGIN");
        setLoginError("");
        setLoginSuccessMessage("Cadastro realizado com sucesso no Supabase! Você já pode entrar.");
        return { success: true };
      } else {
        return { success: false, message: res.message || "Erro ao cadastrar usuário no Supabase." };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || "Erro ao cadastrar usuário." };
    }
  };

  const handleLogout = () => {
    forceLogoutWithReason();
  };

  const ignoreEmergency = (employeeId: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "IGNORE_EMERGENCY", employeeId }));
    }
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId && e.status === "EMERGENCY" ? { ...e, status: "ONLINE" } : e))
    );
  };

  const reloadEmployees = async () => {
    await reloadEmployeesAndHelmets();
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || null;

  // Tela de carregamento rápida enquanto valida a sessão no F5 / Ctrl+R para não piscar a tela de Login
  if (isRestoringSession) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-300">
          Validando Sessão Segura & RBAC...
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Verificando assinatura criptográfica e permissões no Supabase
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {authView === "REGISTER" ? (
          <Register 
            onRegister={handleRegister} 
            onGoBack={() => {
              setAuthView("LOGIN");
              setLoginError("");
            }} 
          />
        ) : (
          <Login 
            onLogin={handleLogin} 
            onGoToRegister={() => {
              setAuthView("REGISTER");
              setLoginError("");
              setLoginSuccessMessage("");
            }}
            onForgotPassword={() => {
              setLoginError("");
              setLoginSuccessMessage("");
              setShowForgotPasswordModal(true);
            }}
            error={loginError} 
            successMessage={loginSuccessMessage}
          />
        )}

        {/* Modal de Recuperação de Senha com OTP - Exibido diretamente na tela de Login */}
        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
          onSuccess={() => {
            setShowForgotPasswordModal(false);
            setLoginError("");
            setLoginSuccessMessage("Senha redefinida com sucesso! Você já pode entrar com sua nova senha.");
          }}
        />

        {/* Modal de Política de Privacidade e Diretrizes LGPD */}
        <PrivacyPolicyModal
          isOpen={showPrivacyPolicyModal}
          onClose={() => setShowPrivacyPolicyModal(false)}
        />

        {/* Banner de Gestão de Cookies e Consentimento LGPD */}
        <CookieConsentBanner 
          onOpenPrivacyPolicy={() => setShowPrivacyPolicyModal(true)} 
        />
      </>
    );
  }

  return (
    <>
      {/* Banner de Alerta de Inatividade (2 minutos antes de derrubar a sessão) */}
      {sessionRemainingSec !== null && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] w-[92%] max-w-xl bg-amber-950/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Alerta de Segurança por Inatividade
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                Sua sessão RBAC será encerrada em{" "}
                <strong className="text-amber-400 font-mono">
                  {Math.floor(sessionRemainingSec / 60)}m {String(sessionRemainingSec % 60).padStart(2, "0")}s
                </strong>{" "}
                por falta de interação.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              lastActivityTouchRef.current = Date.now();
              void dataService.touchSessionActivity();
              setSessionRemainingSec(null);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer"
          >
            Manter Conectado
          </button>
        </div>
      )}

      {view === "HOME" ? (
        <Dashboard 
          username={username}
          userRole={userRole}
          employees={employees}
          helmets={helmets}
          stats={stats}
          activities={activities}
          currentUser={currentUser}
          onNavigateToMap={(empId?: string) => {
            if (empId) setSelectedEmployeeId(empId);
            setView("MAP");
          }} 
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          onOpenHelmetModal={() => setShowHelmetModal(true)}
          onOpenEmployeeModal={() => setShowEmployeeModal(true)}
          onOpenUserModal={() => setShowUserModal(true)}
          onOpenAnalyticsModal={() => setShowAnalyticsModal(true)}
          onOpenPrivacyPolicy={() => setShowPrivacyPolicyModal(true)}
        />
      ) : (
        <div className="min-h-screen w-full bg-zinc-950 flex flex-col md:flex-row overflow-x-hidden font-sans">
          {/* Barra Lateral / Sidebar Responsiva */}
          <div className="flex flex-col md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900">
            <div className="p-3 bg-zinc-900 flex items-center justify-between border-b border-zinc-800">
              <button 
                onClick={() => setView("HOME")}
                className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer text-xs font-bold uppercase tracking-widest p-2 rounded-xl hover:bg-zinc-800"
                aria-label="Voltar para o Painel Principal"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Painel Principal</span>
              </button>

              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="md:hidden flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 text-yellow-500 text-xs font-bold"
                aria-label="Alternar lista de operadores"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                <span>Operadores</span>
              </button>
            </div>

            <div className={`md:block ${showMobileSidebar ? "block" : "hidden md:block"}`}>
              <Sidebar 
                employees={employees} 
                helmets={helmets}
                selectedEmployeeId={selectedEmployeeId} 
                onSelectEmployee={(id) => {
                  setSelectedEmployeeId(id);
                  setShowMobileSidebar(false);
                }} 
                onIgnoreEmergency={ignoreEmergency}
              />
            </div>
          </div>

          {/* Área Principal de Monitoramento (Mapa + Vídeo + Atividades) com Rolagem Natural */}
          <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
            {/* Mapa ao Vivo */}
            <div className="h-[50vh] min-h-[380px] lg:h-[60vh] relative border-b border-zinc-800 w-full">
              <Map 
                employees={employees} 
                helmets={helmets}
                selectedEmployeeId={selectedEmployeeId} 
                onSelectEmployee={setSelectedEmployeeId} 
                userLocation={userLocation}
                userRole={userRole}
              />
              
              {/* Map Overlay Controls */}
              <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
                 <div className="bg-zinc-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-zinc-800 shadow-2xl">
                    <div className="flex items-center gap-2.5 mb-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                         {stats.systemStatus === "EMERGENCY" ? "Alerta de Emergência Ativo" : "Sistema Nominal"}
                       </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                       <div>
                          <div className="text-[9px] text-zinc-500 uppercase font-bold">Capacetes Ativos</div>
                          <div className="text-base font-bold text-zinc-100">{employees.filter(e => e.status !== "OFFLINE").length}</div>
                       </div>
                       <div>
                          <div className="text-[9px] text-zinc-500 uppercase font-bold">Emergências</div>
                          <div className="text-base font-bold text-red-500">{employees.filter(e => e.status === "EMERGENCY").length}</div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Painel Inferior Responsivo: Câmera/Vídeo & Atividades Críticas */}
            <div className="flex-1 flex flex-col lg:flex-row w-full bg-zinc-950">
              <div className="flex-1 p-4 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800">
                <VideoPlayer employee={selectedEmployee} />
              </div>
              
              <div className="w-full lg:w-96 bg-zinc-900 p-5 md:p-6 overflow-y-auto max-h-96 lg:max-h-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-500" />
                    Atividades Críticas em Tempo Real
                  </h3>
                </div>
                <div className="space-y-3">
                  {employees.filter(e => e.status === "EMERGENCY" || e.status === "OFFLINE").length === 0 ? (
                    <div className="text-center py-6 text-zinc-600 text-xs italic">
                      Nenhuma atividade crítica registrada no momento.
                    </div>
                  ) : (
                    employees.filter(e => e.status === "EMERGENCY" || e.status === "OFFLINE").map(emp => (
                      <div key={emp.id} className="flex gap-3 items-start border-l-2 border-zinc-800 pl-3 py-1 group">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          emp.status === "EMERGENCY" ? "bg-red-500 animate-pulse" : "bg-zinc-600"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <p className="text-xs font-bold text-zinc-200 truncate">
                              {emp.status === "EMERGENCY" ? "Alerta de Impacto (ESP32)" : "Capacete Desconectado"}
                            </p>
                            {emp.status === "EMERGENCY" && (
                              <button 
                                onClick={() => ignoreEmergency(emp.id)}
                                className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 transition-colors"
                              >
                                Reconhecer
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {emp.name} ({emp.id}) • Capacete: {emp.assignedHelmetId || "Não vinculado"} • {new Date().toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Modais do Sistema */}
      <HelmetManagementModal
        isOpen={showHelmetModal}
        onClose={() => setShowHelmetModal(false)}
        userRole={userRole}
        employees={employees}
        onRefreshData={reloadEmployees}
      />

      <EmployeeManagementModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        userRole={userRole}
        onRefreshData={reloadEmployees}
      />

      <UserManagementModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        currentUserRole={userRole}
        currentUsername={username}
      />

      <SafetyAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        employees={employees}
        userRole={userRole}
      />

      {/* Modal de Política de Privacidade e Diretrizes LGPD */}
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicyModal}
        onClose={() => setShowPrivacyPolicyModal(false)}
      />

      {/* Banner de Gestão de Cookies e Consentimento LGPD */}
      <CookieConsentBanner 
        onOpenPrivacyPolicy={() => setShowPrivacyPolicyModal(true)} 
      />

      {/* Modal de Recuperação de Senha com OTP */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={() => setShowForgotPasswordModal(false)}
      />
    </>
  );
}
