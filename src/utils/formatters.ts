/**
 * Utilitários de formatação e validação de campos
 */

/**
 * Formata número de telefone brasileiro progressivamente (apenas dígitos)
 * Suporta formatos de 10 dígitos (fixo) e 11 dígitos (celular)
 * Exemplo: 15999999999 -> (15) 99999-9999
 */
export function formatPhone(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formata CPF progressivamente (apenas dígitos)
 * Exemplo: 12345678900 -> 123.456.789-00
 */
export function formatCpf(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export const formatCPF = formatCpf;

/**
 * Valida se um e-mail possui sintaxe válida (RFC 5322 básica)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

/**
 * Valida se o telefone possui pelo menos 10 dígitos (DDD + número)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

/**
 * Formata endereço MAC progressivamente (apenas dígitos hexadecimais)
 * Exemplo: 246f28b47e10 -> 24:6F:28:B4:7E:10
 */
export function formatMacAddress(value: string): string {
  if (!value) return "";
  const hex = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 12).toUpperCase();
  
  if (hex.length <= 2) return hex;
  const parts: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    parts.push(hex.slice(i, i + 2));
  }
  return parts.join(":");
}

/**
 * Valida se o endereço MAC possui formato válido (XX:XX:XX:XX:XX:XX)
 */
export function isValidMacAddress(mac: string): boolean {
  if (!mac) return false;
  return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac.trim());
}

/**
 * Validação completa de CPF com algoritmo de módulo 11 dos dígitos verificadores.
 * Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11).
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;

  // Rejeitar sequências repetidas (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Cálculo do 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const firstDigit = remainder >= 10 ? 0 : remainder;
  if (parseInt(digits.charAt(9)) !== firstDigit) return false;

  // Cálculo do 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const secondDigit = remainder >= 10 ? 0 : remainder;
  if (parseInt(digits.charAt(10)) !== secondDigit) return false;

  return true;
}

/**
 * Normaliza matrícula no formato IND-XXXX
 */
export function formatMatricula(value: string): string {
  if (!value) return "";
  const clean = value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
  return clean;
}
