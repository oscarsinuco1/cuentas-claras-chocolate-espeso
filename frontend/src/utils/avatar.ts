/**
 * Get DiceBear avatar URL for a participant via backend proxy
 * Using 'bottts' style for fun robot avatars
 * @param seed - The avatar seed stored in the database
 * @param name - Fallback to name if seed is not available
 * @returns URL to the avatar SVG via backend proxy
 */
export function getAvatarUrl(seed?: string | null, name?: string): string {
  const avatarId = seed || name || 'default';
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return `${apiUrl}/api/avatar/${encodeURIComponent(avatarId)}`;
}

/**
 * Generate a new random avatar seed (12 chars alphanumeric)
 */
export function generateAvatarSeed(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let seed = '';
  for (let i = 0; i < 12; i++) {
    seed += chars[Math.floor(Math.random() * chars.length)];
  }
  return seed;
}
