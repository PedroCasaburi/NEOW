# 🦺 Industrial Safety Monitor

> **Sistema de Monitoramento Industrial IoT com Capacetes Inteligentes ESP32**  
> Trabalho de Conclusão de Curso (TCC) — Engenharia / Tecnologia  
> Em conformidade com **NR-06** (EPI), **NR-12** (Segurança em Máquinas) e **LGPD** (Lei nº 13.709/2018)

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32-red?logo=espressif)](https://www.espressif.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)

---

## 📋 Visão Geral

O **Industrial Safety Monitor** é um sistema de monitoramento em tempo real de operadores industriais equipados com capacetes inteligentes ESP32. O sistema detecta impactos, quedas, vibração, som e geolocalização GPS, enviando alertas imediatos para a central de operações.

### Funcionalidades Principais

- 🔴 **Alertas de Emergência em Tempo Real** — Detecção de impactos via MPU6050 (acelerômetro/giroscópio)
- 🗺️ **Rastreamento GPS** — Localização ao vivo dos operadores via módulo NEO-6M
- 📡 **Dashboard WebSocket** — Telemetria contínua a 1 Hz via WebSocket + ngrok
- 🔒 **RBAC Completo** — 3 níveis de acesso: Master, Admin Empresa, Visualizador
- 🛡️ **Segurança LGPD** — Hash SHA-256 de senhas, mascaramento de CPF, logs de auditoria
- 📊 **Analytics NR-06/NR-12** — Conformidade com normas regulamentadoras
- 🌐 **Bidirecional Supabase** — Alterações no banco refletem em tempo real no frontend
- 📱 **Responsivo** — Layout adaptado para desktop, tablet e mobile

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Dashboard   │  │  Map (GPS)   │  │ Modais RBAC    │ │
│  │  Telemetria  │  │  Leaflet.js  │  │ Capacetes/Func │ │
│  └──────────────┘  └──────────────┘  └────────────────┘ │
│           │                 │                  │          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                  dataService.ts                      │ │
│  │   ┌─────────────┐    ┌──────────────────────────┐   │ │
│  │   │  Supabase   │    │  LocalStorage (Fallback)  │   │ │
│  │   │  Realtime   │    │  Smart Heartbeat Sync     │   │ │
│  │   └─────────────┘    └──────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ WebSocket (ws://)
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js / Express / server.ts)      │
│   WebSocket Server │ API REST │ OTP Email (Resend)        │
└─────────────────────────────────────────────────────────┘
                          │ HTTP POST (ngrok tunnel)
┌─────────────────────────────────────────────────────────┐
│                   HARDWARE (ESP32 + Sensores)             │
│  MPU6050 (acelerômetro) │ SW-420 (vibração)              │
│  FC-04 (som)            │ NEO-6M (GPS)                   │
│  WiFi IEEE 802.11 b/g/n │ Firmware Arduino IDE           │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + TypeScript | 19 / 5.8 |
| Build | Vite | 6.x |
| Estilização | Tailwind CSS v4 | 4.1 |
| Animações | Motion (Framer) | 12.x |
| Banco de Dados | Supabase (PostgreSQL) | Latest |
| Mapas | React Leaflet | 5.x |
| Backend | Node.js + Express + tsx | 5.x |
| WebSocket | ws | 8.x |
| Email (OTP) | Resend API | 6.x |
| Hardware | ESP32 + Arduino IDE | ESP-IDF |
| Deploy | Vercel (Frontend) | Latest |
| Túnel | ngrok | v3 |

---

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js ≥ 20.x
- Conta no [Supabase](https://supabase.com) (gratuito)
- Conta no [Vercel](https://vercel.com) (gratuito)
- Conta no [Resend](https://resend.com) (para OTP de senha)
- ngrok (para túnel local com ESP32)

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU_USUARIO/industrial-safety-monitor.git
cd industrial-safety-monitor
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Backend (URL local ou ngrok)
VITE_API_URL=http://SEU_IP_LOCAL:3000

# Email OTP (Resend)
RESEND_API_KEY=re_sua_chave_aqui
RESEND_FROM_EMAIL=Industrial Safety Monitor <onboarding@resend.dev>
```

> ⚠️ **NUNCA** faça commit do arquivo `.env` — ele está no `.gitignore`

### 4. Configurar o Banco de Dados Supabase

No painel do Supabase → SQL Editor, cole e execute o conteúdo de [`supabase_schema.sql`](./supabase_schema.sql).

Isso cria:
- Tabelas: `companies`, `users`, `helmets`, `employees`, `telemetry_logs`, `accident_events`, `safety_guidelines`, `password_resets`, `security_audit_logs`, `app_settings`
- Row Level Security (RLS) configurado
- Realtime Bidirecional habilitado para todas as tabelas
- Dados iniciais de demonstração (seed)

### 5. Executar Localmente

```bash
# Inicia o backend (WebSocket + API REST) e o frontend (Vite) juntos
npm run dev
```

Ou separadamente:

```bash
# Backend (server.ts via tsx)
node node_modules/tsx/dist/cli.mjs server.ts

# Frontend (Vite)
npx vite --port 3000 --host 0.0.0.0
```

### 6. Túnel ngrok (para o ESP32)

```bash
# Expor o servidor para a internet
ngrok http 3000
```

Copie a URL HTTPS gerada (ex: `https://abc123.ngrok.io`) e configure no firmware do ESP32.

---

## 👤 Usuários Padrão (Demonstração)

| Usuário | Senha | Nível |
|---------|-------|-------|
| `adminmaster` | `123456` | 👑 Admin Master (acesso total + disclaimers técnicos) |
| `Gbxm` | `123456` | 🏢 Admin Empresa (gestão operacional) |
| `visualizador` | `123456` | 👁️ Visualizador (somente leitura) |

> 🔐 As senhas são automaticamente migradas para hash SHA-256 no primeiro login

---

## 🔒 Segurança e LGPD

- **Hashing de Senhas**: SHA-256 com salt via Web Crypto API (sem dependência externa)
- **Migração Transparente**: Senhas legadas em texto puro são automaticamente hasheadas no login
- **Mascaramento de CPF**: `***.456.789-**` para roles não-Master (LGPD - Princípio da Minimização)
- **Logs de Auditoria**: Todas as ações críticas registradas em `security_audit_logs`
- **OTP Seguro**: Código de 6 dígitos com expiração de 10 minutos para recuperação de senha
- **RBAC**: Controle granular de permissões por role
- **Disclaimers Técnicos**: Visíveis apenas para Admin Master (IPs, nomes de sensores, etc.)
- **Security Headers (Vercel)**: X-Frame-Options, HSTS, CSP, X-Content-Type-Options

---

## 📡 Comunicação Bidirecional Supabase

O sistema sincroniza automaticamente:

1. **Frontend → Supabase**: Cadastros e atualizações via `dataService.ts`
2. **Supabase → Frontend**: Alterações diretas no banco refletem em ≤1s via Realtime WebSocket
3. **Heartbeat Sync**: A cada 5 segundos + ao retornar ao foco da aba

### Tabelas com Realtime Ativo

`users` | `employees` | `helmets` | `accident_events` | `safety_guidelines` | `app_settings` | `password_resets`

---

## 🚀 Deploy no Vercel

1. Conecte o repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. O `vercel.json` já está configurado com:
   - Build command: `npm run build`
   - Security Headers (HSTS, X-Frame-Options, etc.)
   - SPA Rewrite (React Router)
   - Cache de assets estáticos (1 ano)

---

## 📁 Estrutura do Projeto

```
├── src/
│   ├── components/          # Componentes React
│   │   ├── Dashboard.tsx    # Painel principal + telemetria
│   │   ├── Login.tsx        # Autenticação
│   │   ├── Register.tsx     # Cadastro de usuários
│   │   ├── Map.tsx          # Mapa ao vivo (Leaflet)
│   │   ├── ProfileModal.tsx # Edição de perfil
│   │   ├── UserManagementModal.tsx    # RBAC + Config FAQ
│   │   ├── HelmetManagementModal.tsx  # Gestão de capacetes
│   │   ├── EmployeeManagementModal.tsx# Gestão de funcionários
│   │   ├── SafetyAnalyticsModal.tsx   # NR-06/NR-12
│   │   ├── ForgotPasswordModal.tsx    # OTP recuperação de senha
│   │   ├── PrivacyPolicyModal.tsx     # LGPD
│   │   ├── CookieConsentBanner.tsx    # LGPD Cookies
│   │   ├── Sidebar.tsx      # Lista de operadores (mapa)
│   │   └── VideoPlayer.tsx  # Stream de câmera
│   ├── services/
│   │   ├── dataService.ts   # Serviço unificado (Supabase + LocalStorage)
│   │   └── supabaseClient.ts# Inicialização do cliente Supabase
│   ├── utils/
│   │   ├── security.ts      # Hash, LGPD, sanitização, auditoria
│   │   └── formatters.ts    # CPF, telefone, validações
│   ├── types.ts             # Tipos TypeScript globais
│   ├── App.tsx              # Roteamento principal + WebSocket
│   ├── main.tsx             # Entry point React
│   └── index.css            # Estilos globais (Tailwind v4 + Inter)
├── esp32/                   # Firmware dos capacetes
├── api-sensores-local/      # API local auxiliar
├── server.ts                # Backend Node.js (WebSocket + REST + OTP)
├── supabase_schema.sql      # Schema completo do banco de dados
├── vercel.json              # Configuração de deploy + security headers
├── vite.config.ts           # Configuração do Vite
├── .env.example             # Template de variáveis de ambiente
└── .gitignore               # Protege .env e node_modules
```

---

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia backend + frontend (desenvolvimento)
npm run dev:vite     # Somente frontend Vite
npm run build        # Build de produção (TypeScript + Vite)
npm run preview      # Preview do build de produção
```

---

## 📄 Licença

Projeto acadêmico desenvolvido para o Trabalho de Conclusão de Curso.  
© 2026 Industrial Safety Monitor — Todos os direitos reservados.

---

*Desenvolvido com ❤️ para garantir a segurança dos trabalhadores da indústria brasileira.*
