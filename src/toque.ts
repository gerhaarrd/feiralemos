/** true quando o dispositivo é usado principalmente com o dedo (celular, tablet). */
export const TELA_DE_TOQUE =
  typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
