import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, FirebaseUser, OperationType, handleFirestoreError } from '../firebase.ts';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            const email = currentUser.email || `${currentUser.uid}@nutrisync.ai`;
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: email,
              displayName: currentUser.displayName || 'Anonymous User',
              photoURL: currentUser.photoURL || '',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              role: 'user'
            });
            setIsAdmin(email === 'agarwalakshya820@gmail.com');
          } else {
            // Update last login
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
            const userData = userDoc.data();
            setIsAdmin(userData?.role === 'admin' || currentUser.email === 'agarwalakshya820@gmail.com');
          }
        } catch (error) {
          console.error("Auth profile sync failed:", error);
          // If it's a permission error, it might be because the rules are not deployed or incorrect
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
