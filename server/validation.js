// validation.js — restituisce codici-chiave compatibili con translations.js del client

export function validatePositiveNumber(value, key = "invalidVolume") {
  if (value === undefined || value === null || value === "") return key;
  const n = Number(value);
  if (isNaN(n) || n <= 0) return key;
  return null;
}

export function validateDate(value) {
  if (!value) return "invalidDate";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalidDate";
  if (isNaN(new Date(value).getTime())) return "invalidDate";
  return null;
}

export function validateRange(value, min, max) {
  if (value === undefined || value === null) return null; // campo opzionale
  const n = Number(value);
  if (isNaN(n) || n < min || n > max) return "invalidUmidity";
  return null;
}

// Ritorna il primo errore trovato, null se tutto ok
export function firstError(...checks) {
  return checks.find(Boolean) || null;
}
