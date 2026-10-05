// Sign-in is limited to US/Canada numbers, so bare 10-digit numbers are treated as +1.
// Returns E.164 ("+15551234567"), the same format Firebase stores for a signed-in user.
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    if (digits.length < 8 || digits.length > 15) return null;
    const e164 = `+${digits}`;
    return e164.startsWith('+1') && !/^\+1[2-9]\d{2}[2-9]\d{6}$/.test(e164) ? null : e164;
  }
  let national: string | null = null;
  if (digits.length === 10) national = digits;
  else if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1);
  if (!national || !/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) return null;
  return `+1${national}`;
}

export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

// Usable numbers from a picked contact: normalized to E.164, deduplicated, in
// the order the contact lists them. Entries we can't use (e.g. non-US numbers) are dropped.
export function phoneOptions(
  phoneNumbers: { number?: string; digits?: string; label?: string }[] | undefined
): { phone: string; label: string }[] {
  const options: { phone: string; label: string }[] = [];
  (phoneNumbers ?? []).forEach(p => {
    const phone = normalizePhone(p.number ?? p.digits ?? '');
    if (phone && !options.some(o => o.phone === phone)) {
      options.push({ phone, label: p.label ?? 'phone' });
    }
  });
  return options;
}
