// Authentication context for admin portal
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, USER_ROLES } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign in function - only allows admin users
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // PRODUCTION MODE: Use real Firebase authentication
      console.log('🔥 PRODUCTION MODE: Using real Firebase authentication');

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();

      // Check if user is admin
      if (userData.role !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }

      // Check if user is active
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error('Account is deactivated. Please contact system administrator.');
      }

      setUserData(userData);
      return { user, userData };

      // ORIGINAL CODE (commented out for demo)
      /*
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();

      // Check if user is admin
      if (userData.role !== USER_ROLES.ADMIN) {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }

      // Check if user is active
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error('Account is deactivated. Please contact system administrator.');
      }

      setUserData(userData);
      return { user, userData };
      */
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
      throw error;
    }
  };

  // Get fresh user data
  const refreshUserData = async () => {
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          return userData;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
    return null;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return userData?.permissions?.[permission] || false;
  };

  // Get user's ID token for API calls
  const getIdToken = async () => {
    // PRODUCTION MODE: Return real Firebase token
    console.log('🔥 PRODUCTION MODE: Getting real Firebase token');

    if (currentUser) {
      try {
        return await currentUser.getIdToken();
      } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
      }
    }
    return null;
  };

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is signed in
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Verify user is still admin and active
            if (userData.role === USER_ROLES.ADMIN && userData.isActive) {
              setCurrentUser(user);
              setUserData(userData);
            } else {
              // User is no longer admin or is inactive
              await signOut(auth);
              setCurrentUser(null);
              setUserData(null);
              setError('Access revoked. Please contact administrator.');
            }
          } else {
            // User document doesn't exist
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
          }
        } else {
          // User is signed out
          setCurrentUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setCurrentUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    error,
    signIn,
    logout,
    resetPassword,
    refreshUserData,
    hasPermission,
    getIdToken,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
