import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import rawFirebaseConfig from '../firebase-applet-config.json';

const resolvedDatabaseId =
  !rawFirebaseConfig.firestoreDatabaseId ||
  (rawFirebaseConfig.projectId === 'e-lamisblora' &&
    rawFirebaseConfig.firestoreDatabaseId.startsWith('ai-studio-'))
    ? '(default)'
    : rawFirebaseConfig.firestoreDatabaseId;

export const firebaseConfig = {
  ...rawFirebaseConfig,
  firestoreDatabaseId: resolvedDatabaseId,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
export type { User };

/**
 * Normalisasi password untuk Firebase Auth (minimal 6 karakter sesuai ketentuan Firebase Auth)
 */
export function normalizeFirebaseAuthPassword(rawPassword: string): string {
  const clean = rawPassword.trim();
  if (clean.length >= 6) return clean;
  return `${clean}123456`.slice(0, 6);
}

/**
 * Login atau daftarkan akun [namaopd]@oppkpke.com ke Firebase Authentication secara otomatis
 */
export async function syncFirebaseEmailAuth(
  email: string,
  rawPassword: string
): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  const fbPassword = normalizeFirebaseAuthPassword(rawPassword);
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, fbPassword);
    return cred.user;
  } catch {
    try {
      const created = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        fbPassword
      );
      return created.user;
    } catch {
      return auth.currentUser;
    }
  }
}

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn(
        'Firestore connection notice: pastikan Cloud Firestore sudah aktif pada project ' +
          firebaseConfig.projectId
      );
    }
  }
}

void testConnection();
