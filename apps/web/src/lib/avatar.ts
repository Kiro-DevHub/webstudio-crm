const INK = '#0b0f14';
const PAPER = '#ffffff';

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const r = channelLuminance(parseInt(value.slice(0, 2), 16));
  const g = channelLuminance(parseInt(value.slice(2, 4), 16));
  const b = channelLuminance(parseInt(value.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Avatar colours come from the API palette, which spans amber to indigo. White initials are
 * unreadable on the light half of it, so pick whichever ink actually meets contrast.
 */
export function avatarInkFor(backgroundHex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(backgroundHex)) return PAPER;
  const bg = relativeLuminance(backgroundHex);
  const contrastWithPaper = 1.05 / (bg + 0.05);
  const contrastWithInk = (bg + 0.05) / (relativeLuminance(INK) + 0.05);
  return contrastWithInk > contrastWithPaper ? INK : PAPER;
}

/** "Ольга Соколова" -> "ОС"; a single-word name falls back to one letter. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}
