# 🚀 Guia de Deploy — Industrial Safety Monitor

## Pré-requisitos

1. **Conta no GitHub** → repositório `PedroCasaburi/NEOW`
2. **Conta no Supabase** → projeto `bnvamkncugxbmfuacwlb`
3. **Conta no Vercel** → importar do GitHub
4. **Conta no Resend** → para e-mails OTP

---

## ✅ PASSO 1 — Supabase: Executar Migration das Tabelas Faltantes

> **OBRIGATÓRIO ANTES DE QUALQUER COISA**

1. Acesse: https://supabase.com/dashboard/project/bnvamkncugxbmfuacwlb/sql/new
2. Cole o conteúdo de **`supabase_migration_missing_tables.sql`**
3. Clique em **Run** (▶)
4. Confirme que a saída mostra: `MIGRAÇÃO CONCLUÍDA COM SUCESSO!`

### Tabelas que devem existir após a migração:
| Tabela | Status |
|--------|--------|
| `companies` | ✅ Já existe |
| `users` | ✅ Já existe |
| `employees` | ✅ Já existe |
| `helmets` | ✅ Já existe |
| `telemetry_logs` | ✅ Já existe |
| `accident_events` | ✅ Já existe |
| `safety_guidelines` | ✅ Já existe |
| `password_resets` | ⚠️ Criada pela migration |
| `security_audit_logs` | ⚠️ Criada pela migration |
| `app_settings` | ⚠️ Criada pela migration |

---

## ✅ PASSO 2 — GitHub: Publicar o Código

```bash
# Dentro da pasta do projeto (já está configurado):
git add .
git commit -m "feat: migração tabelas faltantes + EMP005 + MCPs configurados"
git push origin main
```

O push no `origin` (PedroCasaburi/NEOW) vai **acionar automaticamente o deploy no Vercel**.

---

## ✅ PASSO 3 — Vercel: Configurar Variáveis de Ambiente

1. Acesse: https://vercel.com/dashboard → seu projeto **NEOW**
2. Vá em **Settings → Environment Variables**
3. Adicione **EXATAMENTE** estas variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://bnvamkncugxbmfuacwlb.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_k0gaEkOsxLxS5JBIxHeDtg_fF4fr9gZ` | Production, Preview, Development |
| `RESEND_API_KEY` | *(sua chave Resend — obtida em resend.com/api-keys)* | Production, Preview |
| `RESEND_FROM_EMAIL` | `Industrial Safety Monitor <onboarding@resend.dev>` | Production, Preview |
| `VITE_API_URL` | *(deixar vazio)* | Production |

> ⚠️ **IMPORTANTE**: O `RESEND_API_KEY` **NÃO** tem o prefixo `VITE_` pois é uma variável de servidor.
> No Vercel (deploy estático do frontend), o Resend **só funciona em API Routes do Vercel**.
> O sistema já tem fallback: sem Resend, o OTP é exibido no terminal (modo simulação).

4. Após adicionar as variáveis, clique em **Redeploy** no último deployment.

---

## ✅ PASSO 4 — Vercel: Verificar Build Settings

Em **Settings → General → Build & Development Settings**:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` *(ou deixar default)*
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## ✅ PASSO 5 — Antigravity IDE: Configurar MCPs

O arquivo `.agents/mcp_config.json` já está criado. Para ativar:

### GitHub MCP
1. Acesse: https://github.com/settings/tokens/new
2. Crie um **Classic Token** com escopos: `repo`, `read:user`
3. Edite `.agents/mcp_config.json` e substitua `COLE_SEU_GITHUB_PAT_AQUI`

### Supabase MCP
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Crie um **Access Token**
3. Edite `.agents/mcp_config.json` e substitua `COLE_SEU_SUPABASE_ACCESS_TOKEN_AQUI`

> ⚠️ O `.agents/mcp_config.json` **PODE** ser commitado (não contém segredos reais se você não colocar os tokens).
> Os tokens devem ser colocados apenas localmente neste arquivo — **não commitar com tokens reais**.

---

## 🔄 Fluxo de Trabalho Completo

```
Você edita código localmente
         ↓
    git push origin main
         ↓
  Vercel auto-deploy (2-3 min)
         ↓
  App atualizado em produção
         ↓
  Supabase Realtime propaga
  mudanças para todos os clientes
```

---

## 🐛 Diagnóstico de Problemas Comuns

### "Operando em modo LocalStorage"
→ As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não estão configuradas.
→ Verifique o arquivo `.env` localmente ou as variáveis no Vercel.

### "Could not find table 'public.app_settings'"
→ Execute o script `supabase_migration_missing_tables.sql` no Supabase SQL Editor.

### OTP não chega por e-mail
→ O `RESEND_API_KEY` funciona apenas no servidor local (`server.ts`).
→ No deploy Vercel (frontend estático), o OTP é gerado via API route ou exibido no terminal.
→ Para produção completa com e-mail, configure Vercel Serverless Functions.

### "Authentication failed" no login
→ O usuário `pedrocasaburi` está no `server.ts` local mas **não está no Supabase**.
→ Adicione-o via Painel do Supabase: Table Editor → users → Insert Row.

---

## 📋 Checklist Final de Validação

- [ ] Migration SQL executada no Supabase
- [ ] `app_settings`, `password_resets`, `security_audit_logs` existem
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Código commitado e push feito para `origin/main`
- [ ] Deploy do Vercel concluído sem erros
- [ ] Login com `adminmaster / 123456` funciona
- [ ] Login com `Gbxm / 123456` funciona
- [ ] Realtime: alterar um valor no Supabase Table Editor reflete no app
- [ ] OTP de recuperação de senha funciona (ou exibe no terminal em dev)
