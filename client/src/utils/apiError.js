// Estrae la chiave di errore dalla risposta axios.
// Il server restituisce { error: "chiaveTraducibile" }.
// t(getApiErrorKey(err)) dà il messaggio nella lingua corrente.
export function getApiErrorKey(err) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    "savingError"
  );
}
