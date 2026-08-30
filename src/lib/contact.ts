/** Support/sales WhatsApp, shared by the public site and the member portal. */
export const WHATSAPP_NUMBER = "6285691418661";

/** wa.me wants a bare international number and a percent-encoded message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
