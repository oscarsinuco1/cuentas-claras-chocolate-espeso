import { customAlphabet } from 'nanoid';

// Caracteres legibles (sin 0, O, I, l para evitar confusión)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Generar código de 12 caracteres: XXXX-XXXX-XXXX (más seguro contra brute force)
const nanoid = customAlphabet(ALPHABET, 12);

// Generar seed para avatar (12 caracteres alfanuméricos)
const avatarNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

export function generatePlanCode(): string {
  const code = nanoid();
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export function generateAvatarSeed(): string {
  return avatarNanoid();
}

// Validar formato del código (ahora acepta ambos formatos para compatibilidad)
export function isValidPlanCode(code: string): boolean {
  // Nuevo formato: XXXX-XXXX-XXXX (12 chars)
  const newFormat = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  // Formato legacy: XXXX-XXXX (8 chars)
  const legacyFormat = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return newFormat.test(code) || legacyFormat.test(code);
}
