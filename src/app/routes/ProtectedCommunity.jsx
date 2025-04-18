import React, { useEffect, useState } from "react";
import { auth } from "../../config"; // Adjust the import path as necessary
import { onAuthStateChanged } from "firebase/auth"; // Adjust the import path as necessary
import Community from "../Pages/Community";
import { Navigate } from "react-router-dom";

const ProtectedCommunity = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <Community />;
};

export default ProtectedCommunity;
