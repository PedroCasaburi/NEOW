# Industrial Safety Monitor — Regras do Agente Antigravity

## Contexto do Projeto
Este é o repositório do **Industrial Safety Monitor** (TCC — PedroCasaburi/NEOW).
É um sistema de monitoramento IoT industrial com capacetes ESP32, React, Supabase e Vercel.

## Stack Oficial
- **Frontend**: React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS 4
- **Banco de Dados**: Supabase (PostgreSQL) — `bnvamkncugxbmfuacwlb.supabase.co`
- **Email Transacional**: Resend API (OTP de recuperação de senha)
- **Deploy**: Vercel (frontend estático via `dist/`)
- **Hardware**: ESP32 + Arduino IDE (firmware em `Codigo_Funcional_ESP_Vercel3_0.ino`)

## Regras de Desenvolvimento

### Banco de Dados (Supabase)
- Schema completo em `supabase_schema.sql` — sempre usar como referência
- Realtime está habilitado para todas as tabelas (INSERT/UPDATE/DELETE)
- RLS habilitado com políticas públicas (demonstração TCC)
- Senhas hasheadas com SHA-256 prefixo `$ism_sha256$`
- **Nunca** remover ou alterar políticas RLS sem testar impacto no Realtime

### Frontend (dataService.ts)
- Toda mutação de dados DEVE atualizar Supabase E LocalStorage simultaneamente
- Heartbeat sync a cada 5 segundos para detectar mudanças diretas no Supabase
- Nunca usar o cliente Supabase diretamente nos componentes React — usar apenas `dataService`
- Notificar via `notifyRealtimeListeners` após qualquer mutação local

### Segurança
- **Nunca** commitar o arquivo `.env` (já no `.gitignore`)
- Variáveis com `VITE_` prefix ficam no frontend (públicas)
- `RESEND_API_KEY` e segredos do servidor ficam APENAS no `.env` local e Vercel dashboard
- CPF sempre mascarado nas logs/auditoria (usar `maskCPF()` de security.ts)

### Git / Deploy
- Branch principal: `main`
- Remote `origin` → GitHub: `PedroCasaburi/NEOW`
- Remote `main` → GitHub: `Gbxm2/RepositorioNEO` (repositório colaborador)
- Vercel auto-deploy via push no `origin/main`
- Variáveis de ambiente de produção configuradas no Vercel Dashboard

### Estilo de Código
- Usar TypeScript strict — sem `any` desnecessário
- Componentes funcionais React com hooks
- Mensagens de console em português (`[Supabase]`, `[Realtime]`, `[dataService]`)
- Comentários em português brasileiro
