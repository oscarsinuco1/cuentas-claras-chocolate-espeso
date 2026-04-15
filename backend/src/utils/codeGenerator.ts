import { customAlphabet } from 'nanoid';

// Caracteres legibles (sin 0, O, I, l para evitar confusión)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Generar código de 8 caracteres: XXXX-XXXX
const nanoid = customAlphabet(ALPHABET, 8);

// Generar seed para avatar (12 caracteres alfanuméricos)
const avatarNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);

export function generatePlanCode(): string {
  const code = nanoid();
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function generateAvatarSeed(): string {
  return avatarNanoid();
}

// Validar formato del código
export function isValidPlanCode(code: string): boolean {
  const regex = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return regex.test(code);
}
