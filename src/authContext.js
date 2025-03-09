// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Track authentication errors

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        try {
          if (user) {
            setUser(user); // Set the full user object
            setError(null); // Clear any previous errors
          } else {
            setUser(null); // Clear user if not authenticated
            setError("No authenticated user found."); // Set error if no user
          }
        } catch (err) {
          setError(`Authentication error: ${err.message}`);
          setUser(null);
        } finally {
          setLoading(false); // Set loading to false once auth state is determined
        }
      },
      (error) => {
        // Handle onAuthStateChanged errors (e.g., network issues)
        setError(`Failed to check authentication state: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup function to unsubscribe from the listener
  }, []);

  // Provide userId, loading, and error in the context
  const value = {
    userId: user ? user.uid : null, // Extract userId from the user object
    user, // Provide the full user object for other uses
    loading, // Indicate if authentication is in progress
    error, // Pass any authentication errors
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
