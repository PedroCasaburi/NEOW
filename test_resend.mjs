// Teste direto do Resend API
import { Resend } from './node_modules/resend/dist/index.mjs';

import fs from 'fs';

let envKey = '';
let envFrom = '';
try {
  if (fs.existsSync('.env')) {
    const envLines = fs.readFileSync('.env', 'utf8').split('\n');
    for (const line of envLines) {
      if (line.startsWith('RESEND_API_KEY=')) envKey = line.replace('RESEND_API_KEY=', '').trim();
      if (line.startsWith('RESEND_FROM_EMAIL=')) envFrom = line.replace('RESEND_FROM_EMAIL=', '').trim();
    }
  }
} catch {}

const apiKey = process.env.RESEND_API_KEY || envKey;
const fromEmail = process.env.RESEND_FROM_EMAIL || envFrom || 'Industrial Safety Monitor <onboarding@resend.dev>';

console.log('\n========================================');
console.log('   TESTE DO RESEND API');
console.log('========================================');
console.log('API Key:', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'NÃO CONFIGURADA');
console.log('From Email:', fromEmail);
console.log('');

const resend = new Resend(apiKey);

async function testResend() {
  try {
    // 1. Verificar API Key (listando domínios)
    const domains = await resend.domains.list();
    console.log('✅ API Key válida!');
    console.log('Domínios verificados:', JSON.stringify(domains?.data?.data?.map(d => d.name) || []));
    
    // 2. Testar envio para um e-mail real (usando onboarding@resend.dev que é o default)
    // IMPORTANTE: com conta gratuita sem domínio verificado, só pode enviar para o e-mail da conta
    const result = await resend.emails.send({
      from: fromEmail,
      to: ['pedrocasaburi@hotmail.com'], // Apenas o e-mail do dono da conta funciona sem domínio verificado
      subject: '[TESTE] Industrial Safety Monitor - Conectividade Resend OK',
      html: `
        <h2>✅ Resend está funcionando!</h2>
        <p>Este é um e-mail de teste da conexão Resend do Industrial Safety Monitor.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
    
    if (result.error) {
      console.error('❌ Erro ao enviar e-mail:', JSON.stringify(result.error));
    } else {
      console.log('✅ E-mail enviado com sucesso! ID:', result.data?.id);
    }
  } catch (err) {
    console.error('❌ Falha no Resend:', err.message || err);
    
    if (err.message?.includes('API key')) {
      console.log('\n⚠️  A chave API do Resend pode estar inválida ou expirada.');
      console.log('    Obtenha uma nova em: https://resend.com/api-keys');
    }
    if (err.message?.includes('domain')) {
      console.log('\n⚠️  Para enviar para qualquer e-mail, verifique um domínio em: https://resend.com/domains');
      console.log('    Sem domínio verificado, só é possível enviar para o e-mail da conta Resend.');
    }
  }
}

testResend().catch(console.error);
