-- ============================================================
-- INDUSTRIAL SAFETY MONITOR — MIGRAÇÃO DE TABELAS FALTANTES
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/bnvamkncugxbmfuacwlb/sql/new
-- ============================================================
-- Diagnóstico: As tabelas abaixo não estavam no schema cache do Supabase.
-- Este script é idempotente (seguro rodar múltiplas vezes com IF NOT EXISTS).
-- ============================================================

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'password_resets' 
    AND policyname = 'Allow public access to password_resets'
  ) THEN
    CREATE POLICY "Allow public access to password_resets" 
    ON password_resets FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Adicionar tabela password_resets à publicação de Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE password_resets;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN
      -- Cria a publicação se não existir
      CREATE PUBLICATION supabase_realtime;
      ALTER PUBLICATION supabase_realtime ADD TABLE password_resets;
  END;
END $$;

ALTER TABLE password_resets REPLICA IDENTITY FULL;

-- ============================================================
-- 8. TABELA DE AUDITORIA DE CIBERSEGURANÇA E CONFORMIDADE (LGPD)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON security_audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON security_audit_logs (actor_username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON security_audit_logs (action);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_audit_logs' 
    AND policyname = 'Allow public access to security_audit_logs'
  ) THEN
    CREATE POLICY "Allow public access to security_audit_logs" 
    ON security_audit_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 10. TABELA DE CONFIGURAÇÕES DA APLICAÇÃO (Admin Master / FAQ Forms)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT ('SET-' || substr(md5(random()::text), 1, 8)),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'app_settings' 
    AND policyname = 'Allow public access to app_settings'
  ) THEN
    CREATE POLICY "Allow public access to app_settings" 
    ON app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Adicionar à publicação Realtime para comunicação bidirecional
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

ALTER TABLE app_settings REPLICA IDENTITY FULL;

-- Seed: URL padrão vazia para o Google Forms (Admin Master vai preencher pelo painel)
INSERT INTO app_settings (key, value, description)
VALUES ('faq_forms_url', '', 'URL do Google Forms para solicitações e FAQ dos usuários. Configurável pelo Admin Master.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- COLUNAS ADICIONAIS NA TABELA USERS (revogação de sessão)
-- ============================================================
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
-- EMPLOYEE EMP005 — Augusto Melo (já existe no Supabase, garantir dados corretos)
-- ============================================================
INSERT INTO employees (id, name, cpf, matricula, role_function, department, shift, emergency_contact, status, lat, lng, last_seen, battery, assigned_helmet_id, company_id)
VALUES 
('EMP005', 'Augusto Melo', '567.890.123-44', 'IND-1048', 'Técnico de Segurança do Trabalho', 'Segurança e Higiene Ocupacional', '1º Turno (06h - 14h)', '(11) 94444-5555 (Pai - Renato)', 'OFFLINE', -23.5545, -46.6373, 0, 100, NULL, 'COMP-001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROTINA DE HIGIENIZAÇÃO (HOUSEKEEPING) — LIMPEZA AUTOMÁTICA
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
-- VERIFICAÇÃO FINAL — confirma todas as tabelas
-- ============================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') AS colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO! Todas as tabelas do Industrial Safety Monitor estão ativas.' AS status;
