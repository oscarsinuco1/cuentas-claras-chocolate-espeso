import type { Currency } from '@/types';

const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string; name: string }> = {
  COP: { symbol: '$', locale: 'es-CO', name: 'Peso Colombiano' },
  USD: { symbol: '$', locale: 'en-US', name: 'Dólar' },
  EUR: { symbol: '€', locale: 'es-ES', name: 'Euro' },
  MXN: { symbol: '$', locale: 'es-MX', name: 'Peso Mexicano' },
  ARS: { symbol: '$', locale: 'es-AR', name: 'Peso Argentino' },
  PEN: { symbol: 'S/', locale: 'es-PE', name: 'Sol Peruano' },
  CLP: { symbol: '$', locale: 'es-CL', name: 'Peso Chileno' },
  BRL: { symbol: 'R$', locale: 'pt-BR', name: 'Real' },
};

export const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'USD', name: 'Dólar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'BRL', name: 'Real', symbol: 'R$' },
];

export function formatMoney(amount: number, currency: Currency = 'COP'): string {
  const config = CURRENCY_CONFIG[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'COP' || currency === 'CLP' ? 0 : 2,
    maximumFractionDigits: currency === 'COP' || currency === 'CLP' ? 0 : 2,
  }).format(amount);
}

const STORAGE_KEY = 'preferred_currency';

export function getPreferredCurrency(): Currency {
  if (typeof window === 'undefined') return 'COP';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CURRENCIES.some(c => c.code === stored)) {
    return stored as Currency;
  }
  return 'COP';
}

export function setPreferredCurrency(currency: Currency): void {
  localStorage.setItem(STORAGE_KEY, currency);
}
