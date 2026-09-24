// Teste de conectividade com o Supabase
import { createClient } from './node_modules/@supabase/supabase-js/dist/index.cjs';

const supabase = createClient(
  'https://bnvamkncugxbmfuacwlb.supabase.co',
  'sb_publishable_k0gaEkOsxLxS5JBIxHeDtg_fF4fr9gZ'
);

async function runTests() {
  console.log('\n========================================');
  console.log('   TESTE DE CONECTIVIDADE SUPABASE');
  console.log('========================================\n');

  // Teste 1: Users
  const { data: users, error: uErr } = await supabase.from('users').select('username, role, active, email').order('username');
  if (uErr) console.error('❌ USERS:', JSON.stringify(uErr));
  else {
    console.log(`✅ USERS (${users.length} registros):`);
    users.forEach(u => console.log(`   - ${u.username} [${u.role}] ${u.active ? '✓ ATIVO' : '✗ INATIVO'} | ${u.email}`));
  }

  // Teste 2: Employees
  const { data: emps, error: eErr } = await supabase.from('employees').select('id, name, status, battery').order('id');
  if (eErr) console.error('\n❌ EMPLOYEES:', JSON.stringify(eErr));
  else {
    console.log(`\n✅ EMPLOYEES (${emps.length} registros):`);
    emps.forEach(e => console.log(`   - ${e.id}: ${e.name} [${e.status}] bateria: ${e.battery}%`));
  }

  // Teste 3: Helmets
  const { data: helms, error: hErr } = await supabase.from('helmets').select('id, serial_number, status, battery').order('id');
  if (hErr) console.error('\n❌ HELMETS:', JSON.stringify(hErr));
  else {
    console.log(`\n✅ HELMETS (${helms.length} registros):`);
    helms.forEach(h => console.log(`   - ${h.id}: ${h.serial_number} [${h.status}] bateria: ${h.battery}%`));
  }

  // Teste 4: Accident Events
  const { data: accs, error: aErr } = await supabase.from('accident_events').select('id, employee_name, aceleracao_g, acknowledged').order('timestamp', { ascending: false }).limit(5);
  if (aErr) console.error('\n❌ ACCIDENT_EVENTS:', JSON.stringify(aErr));
  else {
    console.log(`\n✅ ACCIDENT_EVENTS (${accs.length} registros):`);
    accs.forEach(a => console.log(`   - ${a.id}: ${a.employee_name} ${a.aceleracao_g}G ${a.acknowledged ? '(reconhecido)' : '(pendente)'}`));
  }

  // Teste 5: App Settings
  const { data: settings, error: sErr } = await supabase.from('app_settings').select('key, value, updated_by');
  if (sErr) console.error('\n❌ APP_SETTINGS:', JSON.stringify(sErr));
  else {
    console.log(`\n✅ APP_SETTINGS (${settings.length} registros):`);
    settings.forEach(s => console.log(`   - ${s.key}: "${s.value || '(vazio)'}" (por: ${s.updated_by || 'system'})`));
  }

  // Teste 6: Safety Guidelines
  const { data: guides, error: gErr } = await supabase.from('safety_guidelines').select('id, code, compliance_status');
  if (gErr) console.error('\n❌ SAFETY_GUIDELINES:', JSON.stringify(gErr));
  else {
    console.log(`\n✅ SAFETY_GUIDELINES (${guides.length} registros):`);
    guides.forEach(g => console.log(`   - ${g.id}: ${g.code} [${g.compliance_status}]`));
  }

  // Teste 7: Password Resets
  const { data: resets, error: rErr } = await supabase.from('password_resets').select('id, email, used, expires_at').limit(5);
  if (rErr) console.error('\n❌ PASSWORD_RESETS:', JSON.stringify(rErr));
  else {
    console.log(`\n✅ PASSWORD_RESETS (${resets.length} registros recentes)`);
  }

  // Teste 8: Audit Logs
  const { data: auditLogs, error: audErr } = await supabase.from('security_audit_logs').select('action, actor_username, created_at').order('created_at', { ascending: false }).limit(3);
  if (audErr) console.error('\n❌ SECURITY_AUDIT_LOGS:', JSON.stringify(audErr));
  else {
    console.log(`\n✅ SECURITY_AUDIT_LOGS (${auditLogs.length} registros recentes):`);
    auditLogs.forEach(a => console.log(`   - [${a.action}] por ${a.actor_username} em ${a.created_at}`));
  }

  console.log('\n========================================');
  console.log('   TESTE CONCLUÍDO');
  console.log('========================================\n');
}

runTests().catch(e => {
  console.error('FALHA FATAL:', e);
  process.exit(1);
});
