import { deleteApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  type Auth,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, type Firestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export const BOOTSTRAP_ADMIN_EMAIL = 'andreluiscelis@celisapp.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const resolvedFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || '').trim(),
  authDomain: (
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    firebaseAppletConfig.authDomain ||
    ''
  ).trim(),
  projectId: (
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    firebaseAppletConfig.projectId ||
    ''
  ).trim(),
  storageBucket: (
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    firebaseAppletConfig.storageBucket ||
    ''
  ).trim(),
  messagingSenderId: (
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseAppletConfig.messagingSenderId ||
    ''
  ).trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || '').trim(),
};

export const FIRESTORE_DATABASE_ID = (
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  firebaseAppletConfig.firestoreDatabaseId ||
  '(default)'
).trim();

export const hasFirebaseConfig = Boolean(
  resolvedFirebaseConfig.apiKey && resolvedFirebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (hasFirebaseConfig) {
  app = getApps().length ? getApps()[0] : initializeApp(resolvedFirebaseConfig);
  db =
    FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)'
      ? getFirestore(app, FIRESTORE_DATABASE_ID)
      : getFirestore(app);
  auth = getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, db, auth, resolvedFirebaseConfig };

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

/**
 * Creates a Firebase Auth user with email & password using a secondary app instance
 * so the currently signed-in admin session is never interrupted.
 */
export async function createSecondaryStaffAccount(
  email: string,
  password: string
): Promise<{ uid: string; email: string }> {
  if (!hasFirebaseConfig) {
    throw new Error('Firebase não configurado. Defina VITE_FIREBASE_API_KEY.');
  }
  const secondaryApp = initializeApp(
    resolvedFirebaseConfig,
    `staff-creator-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    try {
      await sendEmailVerification(credential.user);
    } catch {
      // Verification email is best-effort; user can resend upon login
    }
    const uid = credential.user.uid;
    const normalizedEmail = credential.user.email || email;
    await signOut(secondaryAuth);
    return { uid, email: normalizedEmail };
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}
