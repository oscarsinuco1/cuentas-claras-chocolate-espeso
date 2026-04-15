/**
 * Get Multiavatar URL for a participant
 * @param seed - The avatar seed stored in the database
 * @param name - Fallback to name if seed is not available
 * @returns URL to the Multiavatar SVG
 */
export function getAvatarUrl(seed?: string | null, name?: string): string {
  const avatarId = seed || name || 'default';
  return `https://api.multiavatar.com/${encodeURIComponent(avatarId)}.svg`;
}
