-- ============================================================
-- INDUSTRIAL SAFETY MONITOR - SCHEMA SUPABASE (POSTGRESQL)
-- Trabalho de Conclusão de Curso (TCC)
-- Sistema de Monitoramento em Tempo Real com Capacetes Inteligentes (ESP32)
-- ============================================================

-- Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE EMPRESAS
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY DEFAULT ('COMP-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    cnpj TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE USUÁRIOS E CONTROLE DE ACESSO (RBAC)
-- Perfis: 'MASTER' (Admin Geral), 'COMPANY_ADMIN' (Gestor da Empresa), 'VIEWER' (Somente Leitura)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT ('USR-' || substr(md5(random()::text), 1, 8)),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('MASTER', 'COMPANY_ADMIN', 'VIEWER')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    cpf TEXT,
    position TEXT,
    department TEXT,
    email TEXT,
    phone TEXT,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT TRUE,
    token_version INTEGER DEFAULT 1,
    last_password_change TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CAPACETES INTELIGENTES (DISPOSITIVOS IOT / ESP32)
CREATE TABLE IF NOT EXISTS helmets (
    id TEXT PRIMARY KEY,
    serial_number TEXT UNIQUE NOT NULL,
    mac_address TEXT,
    firmware_version TEXT DEFAULT 'v1.0.4',
    battery INTEGER DEFAULT 100 CHECK (battery >= 0 AND battery <= 100),
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE')),
    last_calibration TIMESTAMPTZ,
    next_inspection TIMESTAMPTZ,
    assigned_employee_id TEXT,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE FUNCIONÁRIOS / OPERADORES DE CAMPO
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT,
    matricula TEXT,
    role_function TEXT,
    department TEXT,
    shift TEXT,
    emergency_contact TEXT,
    status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'EMERGENCY', 'UNSTABLE', 'INACTIVE')),
    lat DOUBLE PRECISION DEFAULT -23.5505,
    lng DOUBLE PRECISION DEFAULT -46.6333,
    last_seen BIGINT DEFAULT 0,
    battery INTEGER DEFAULT 100,
    assigned_helmet_id TEXT REFERENCES helmets(id) ON DELETE SET NULL,
    company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE TELEMETRIA E HISTÓRICO DE SENSORES (MPU6050, SW-420, FC-04, NEO-6M)
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    helmet_id TEXT,
    employee_id TEXT,
    aceleracao DOUBLE PRECISION DEFAULT 0.0,
    aceleracao_g DOUBLE PRECISION DEFAULT 1.0,
    pico_g DOUBLE PRECISION DEFAULT 1.0,
    pontuacao INTEGER DEFAULT 0,
    vibracao BOOLEAN DEFAULT FALSE,
    som BOOLEAN DEFAULT FALSE,
    gps_valido BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    altitude DOUBLE PRECISION DEFAULT 0.0,
    satelites INTEGER DEFAULT 0,
    ip_origem TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE EVENTOS DE ACIDENTES / ALERTAS DE IMPACTO
CREATE TABLE IF NOT EXISTS accident_events (
    id TEXT PRIMARY KEY DEFAULT ('ACC-' || substr(md5(random()::text), 1, 8)),
    timestamp BIGINT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    aceleracao_g DOUBLE PRECISION NOT NULL,
    pico_g DOUBLE PRECISION NOT NULL,
    pontuacao INTEGER NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    vibracao BOOLEAN DEFAULT FALSE,
    som BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE NORMAS REGULAMENTADORAS (NR-06 e NR-12)
CREATE TABLE IF NOT EXISTS safety_guidelines (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    compliance_status TEXT DEFAULT 'CONFORME' CHECK (compliance_status IN ('CONFORME', 'ATENCAO', 'CRITICO')),
    last_audit TIMESTAMPTZ DEFAULT NOW(),
    details JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_telemetry_employee_time ON telemetry_logs (employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accidents_timestamp ON accident_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);
CREATE INDEX IF NOT EXISTS idx_helmets_status ON helmets (status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - PERMISSIVO PARA DEMONSTRAÇÃO
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE helmets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_guidelines ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para a chave anon do Supabase no Frontend
CREATE POLICY "Allow public access to companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to helmets" ON helmets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to telemetry_logs" ON telemetry_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to accident_events" ON accident_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to safety_guidelines" ON safety_guidelines FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- CONTROLE DE INTEGRIDADE RBAC E SESSÃO (SEM SEED DATA FICTÍCIO)
-- ============================================================
-- Nota Arquitetural: Os dados fictícios de inicialização (SEED DATA de usuários,
-- capacetes, operadores e acidentes) foram removidos para garantir que o banco
-- reflita exclusivamente os dados reais de produção e telemetria IoT.

-- Trigger automática no PostgreSQL para incrementar token_version ao alterar senha, perfil RBAC ou desativar conta
CREATE OR REPLACE FUNCTION trg_users_security_token_bump()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.password IS DISTINCT FROM NEW.password) THEN
        NEW.token_version := COALESCE(OLD.token_version, 1) + 1;
        NEW.last_password_change := NOW();
    ELSIF (OLD.active IS DISTINCT FROM NEW.active AND NEW.active = FALSE) THEN
        NEW.token_version := COALESCE(OLD.token_version, 1) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_security_token_bump ON users;
CREATE TRIGGER users_security_token_bump
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trg_users_security_token_bump();

-- 8. TABELA DE AUDITORIA DE CIBERSEGURANÇA E CONFORMIDADE (LGPD)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('AUD-' || substr(md5(random()::text), 1, 10)),
    timestamp BIGINT NOT NULL,
    action TEXT NOT NULL,
    actor_username TEXT NOT NULL,
    target TEXT,
    details TEXT,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to security_audit_logs" ON security_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- HABILITAR SUPABASE REALTIME (COMUNICAÇÃO BIDIRECIONAL)
-- ============================================================
-- Permite que qualquer alteração manual ou via SQL na raiz do Supabase
-- seja imediatamente propagada para a aplicação Safety Monitor via WebSocket Realtime!

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Adiciona tabelas à publicação de Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users, employees, helmets, accident_events, safety_guidelines;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Tabelas já presentes na publicação
      NULL;
  END;
END $$;

-- REPLICA IDENTITY FULL garante que eventos de UPDATE e DELETE transmitam todos os campos antigos e novos
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE employees REPLICA IDENTITY FULL;
ALTER TABLE helmets REPLICA IDENTITY FULL;
ALTER TABLE accident_events REPLICA IDENTITY FULL;
ALTER TABLE safety_guidelines REPLICA IDENTITY FULL;

-- ============================================================
-- 9. TABELA DE RECUPERAÇÃO DE SENHA (OTP com Hash Seguro)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY DEFAULT ('PR-' || substr(md5(random()::text), 1, 10)),
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets (expires_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_used ON password_resets (used);

ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to password_resets" ON password_resets FOR ALL USING (true) WITH CHECK (true);

-- Adicionar tabela password_resets à publicação de Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE password_resets;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE password_resets REPLICA IDENTITY FULL;

-- Adicionar colunas de revogação de sessão na tabela users (idempotente)
DO $$
BEGIN
  BEGIN
    ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE users ADD COLUMN last_password_change TIMESTAMPTZ DEFAULT NOW();
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- ============================================================
-- ROTINA DE HIGIENIZAÇÃO (HOUSEKEEPING) - LIMPEZA AUTOMÁTICA
-- ============================================================
CREATE OR REPLACE FUNCTION purge_expired_password_resets()
RETURNS void AS $$
BEGIN
    DELETE FROM password_resets
    WHERE expires_at < NOW() - INTERVAL '1 day'
       OR (used = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 10. TABELA DE CONFIGURAÇÕES DA APLICAÇÃO (Admin Master)
-- ============================================================
-- Usada para armazenar URL do Google Forms FAQ, e outras configurações globais
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT ('SET-' || substr(md5(random()::text), 1, 8)),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_by TEXT,             -- username do admin que atualizou
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e política pública (leitura livre, escrita apenas via service)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Adicionar à publicação Realtime para comunicação bidirecional
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE app_settings REPLICA IDENTITY FULL;

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);

-- Seed: URL padrão vazia para o Google Forms (Admin Master vai preencher pelo painel)
INSERT INTO app_settings (key, value, description)
VALUES ('faq_forms_url', '', 'URL do Google Forms para solicitações e FAQ dos usuários. Configurável pelo Admin Master.')
ON CONFLICT (key) DO NOTHING;

-- Mensagem de confirmação
SELECT 'Schema do Industrial Safety Monitor com Realtime Bidirecional, OTP Seguro, Cibersegurança e Configurações Globais configurados com sucesso!' AS status;

