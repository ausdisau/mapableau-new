// Store a non-extractable CryptoKey separately from the encrypted browser records.
// A read/write transaction makes two first-time tabs select the same key.
let pending: Promise<CryptoKey> | undefined;
async function openKey(): Promise<CryptoKey> {
  const candidate = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("mapable-passenger-practice", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("keys");
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error("Practice storage is blocked"));
    open.onsuccess = () => {
      const database = open.result;
      const transaction = database.transaction("keys", "readwrite");
      const keys = transaction.objectStore("keys");
      let key = candidate;
      const current = keys.get("practice");
      current.onsuccess = () => {
        if (current.result) key = current.result;
        else keys.add(candidate, "practice");
      };
      transaction.oncomplete = () => {
        database.close();
        resolve(key);
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}
export function passengerLocalKey(): Promise<CryptoKey> {
  return (pending ??= openKey().catch((error) => {
    pending = undefined;
    throw error;
  }));
}
