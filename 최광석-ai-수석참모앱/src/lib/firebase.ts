import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase app singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID from config
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

// Initialize Authentication
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

import {
  CanonicalUserRole,
  UserStatus,
  EnvironmentType,
  toCanonicalUserRole,
} from '../types/index';

export interface UserProfile {
  userId: string;
  firebaseUid: string;
  name: string;
  displayName?: string;
  email: string;
  role: 'owner' | 'secretary' | 'advisor' | 'viewer' | 'admin' | CanonicalUserRole;
  canonicalRole: CanonicalUserRole;
  status: UserStatus;
  environment: EnvironmentType;
  currentProjectId?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Validate connection to Firestore using server ping
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connection validated successfully with server.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] The client appears to be offline. Verify network connection.');
      return false;
    }
    // Expected if 'test/connection' does not exist yet; network handshake succeeded
    return true;
  }
}

/**
 * Sync or create user profile upon successful authentication
 * ENFORCES G2 AUTH HARDENING:
 * 1. Primary key is canonical firebaseUid (user.uid).
 * 2. ONLY 1000gn521@gmail.com can be bootstrapped as OWNER.
 * 3. All other new users default to MEMBER/ADVISOR.
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const canonicalRole = toCanonicalUserRole(data.canonicalRole || data.role);
      
      const profile: UserProfile = {
        userId: user.uid,
        firebaseUid: user.uid,
        name: data.displayName || data.name || user.displayName || user.email?.split('@')[0] || 'Executive Staff',
        displayName: data.displayName || user.displayName || undefined,
        email: user.email || data.email || '',
        role: data.role || (canonicalRole === 'OWNER' ? 'owner' : 'advisor'),
        canonicalRole,
        status: data.status || 'ACTIVE',
        environment: data.environment || 'TEST',
        currentProjectId: data.currentProjectId || 'proj-gunsan-pmi',
        createdAt: data.createdAt,
        updatedAt: serverTimestamp(),
      };
      
      // Update last active timestamp
      await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
      return profile;
    } else {
      // Safe Provisioning: Bootstrap OWNER role ONLY for designated administrative email
      const isInitialOwner = user.email === '1000gn521@gmail.com';
      const canonicalRole: CanonicalUserRole = isInitialOwner ? 'OWNER' : 'MEMBER';
      const legacyRole = isInitialOwner ? 'owner' : 'advisor';
      
      const newProfile: UserProfile = {
        userId: user.uid,
        firebaseUid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || (isInitialOwner ? '본부장' : '비서실 참모'),
        displayName: user.displayName || undefined,
        email: user.email || '',
        role: legacyRole,
        canonicalRole,
        status: 'ACTIVE',
        environment: 'TEST',
        currentProjectId: 'proj-gunsan-pmi',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(userRef, newProfile);

      // Provision default membership record for primary project
      try {
        const membershipRef = doc(db, 'memberships', `${user.uid}_proj-gunsan-pmi`);
        await setDoc(membershipRef, {
          membershipId: `${user.uid}_proj-gunsan-pmi`,
          projectId: 'proj-gunsan-pmi',
          userId: user.uid,
          role: canonicalRole,
          status: 'ACTIVE',
          environment: 'TEST',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (memErr) {
        console.warn('[UserProfile] Membership provisioning notice:', memErr);
      }

      return newProfile;
    }
  } catch (err) {
    console.error('[UserProfile] Failed to sync user profile with Firestore:', err);
    const isOwner = user.email === '1000gn521@gmail.com';
    return {
      userId: user.uid,
      firebaseUid: user.uid,
      name: user.displayName || (isOwner ? '본부장' : '비서실 참모'),
      email: user.email || '',
      role: isOwner ? 'owner' : 'advisor',
      canonicalRole: isOwner ? 'OWNER' : 'MEMBER',
      status: 'ACTIVE',
      environment: 'TEST',
      currentProjectId: 'proj-gunsan-pmi',
    };
  }
}

/**
 * Google Sign-In with popup
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await syncUserProfile(result.user);
  } catch (err: any) {
    console.error('[Auth] Google Sign-In error:', err);
    throw err;
  }
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(
  onUserChanged: (user: FirebaseUser | null, profile: UserProfile | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await syncUserProfile(user);
      onUserChanged(user, profile);
    } else {
      onUserChanged(null, null);
    }
  });
}

/**
 * Ensure an authenticated session is active (anonymous or Google)
 */
export async function ensureAuthenticatedSession(): Promise<FirebaseUser | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    console.log('[Auth] Anonymous session initialized for preview/system operations.');
    return cred.user;
  } catch (err: any) {
    console.info('[Auth] Anonymous sign-in not available or deferred until interactive login:', err?.code || err);
    return null;
  }
}

// Initial session & connection initialization
ensureAuthenticatedSession().finally(() => {
  testFirestoreConnection();
});
