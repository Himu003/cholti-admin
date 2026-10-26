import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function init() {
  if (!getApps().length) {
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (inline) initializeApp({ credential: cert(JSON.parse(inline)) });
    else if (keyFile) initializeApp({ credential: cert(keyFile) });
    else throw new Error("Firebase credentials are not set");
  }
}

let cached: ReturnType<typeof getFirestore> | null = null;

export function fsdb() {
  init();
  if (!cached) cached = getFirestore();
  return cached;
}
