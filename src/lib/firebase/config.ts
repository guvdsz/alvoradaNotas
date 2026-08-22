const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(
    (value) => Boolean(value) && !value?.startsWith("seu-"),
  );
}

export function getFirebaseConfig() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase não configurado. Preencha as variáveis NEXT_PUBLIC_FIREBASE_* no arquivo .env.local.",
    );
  }

  return firebaseConfig as Record<keyof typeof firebaseConfig, string>;
}
