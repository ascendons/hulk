// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe(); // Cleanup function to unsubscribe from the listener
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

// CLOUDINARY_CLOUD_NAME = dwdejk1u3
// CLOUDINARY_API_KEY =865623334216492
// CLOUDINARY_SECRET = fMXHWl_U3sFsY6iw1hlb7EM_dzA
