import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'doctor' | 'patient'
  const [authLoading, setAuthLoading] = useState(true);

  // Helper to fetch and normalize user profile from Firestore
  const fetchUserProfile = async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setRole(null);
      return null;
    }

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        let normalizedRole = (data.role || "patient").toLowerCase();
        if (normalizedRole === "user") normalizedRole = "patient";

        const profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...data,
          role: normalizedRole,
        };
        setUserProfile(profile);
        setRole(normalizedRole);
        return profile;
      } else {
        // Firestore profile was deleted — sign the user out immediately
        // to prevent ghost sessions for accounts whose data was removed
        await signOut(auth);
        setUserProfile(null);
        setRole(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUserProfile(null);
      setRole(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Unified login
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const profile = await fetchUserProfile(userCredential.user);

    // If no Firestore profile found (account was deleted), block access
    if (!profile) {
      const err = new Error(
        "This account no longer exists in the system. Please contact the clinic administrator."
      );
      err.code = "auth/account-deleted";
      throw err;
    }

    // Security restriction: prevent login with old/obsolete email if account email was changed
    const activeProfileEmail = (profile?.email || "").trim().toLowerCase();
    if (activeProfileEmail && activeProfileEmail !== cleanEmail) {
      await signOut(auth);
      const err = new Error(
        `This account's email has been updated to "${profile.email}". The old email "${cleanEmail}" is disabled. Please sign in using your new email address.`
      );
      err.code = "auth/email-changed";
      throw err;
    }

    return { user: userCredential.user, profile, role: profile?.role || "patient" };
  };

  // Patient registration only (forced role: "patient")
  const registerPatient = async ({
    fullName,
    email,
    phone,
    gender,
    dateOfBirth,
    password,
  }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const patientDoc = {
      uid: user.uid,
      fullName,
      email,
      phone: phone || "",
      gender: gender || "",
      dateOfBirth: dateOfBirth || "",
      role: "patient", // STRICT INTERNAL ASSIGNMENT
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), patientDoc);
    await fetchUserProfile(user);

    return { user, profile: patientDoc };
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setRole(null);
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      return await fetchUserProfile(auth.currentUser);
    }
    return null;
  };

  const value = {
    currentUser,
    userProfile,
    role,
    authLoading,
    login,
    registerPatient,
    logout,
    resetPassword,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
