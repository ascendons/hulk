import React, { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./app/Pages/Home"; // Import Dashboard component
import Signuppage from "./app/Pages/Signuppage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state

  return (
    <BrowserRouter>
      <Routes>
        {/* Signup Page */}
        <Route
          path="/signup"
          element={<Signuppage onLogin={() => setIsAuthenticated(true)} />}
        />

        {/* Protected Dashboard Page */}
        <Route
          path="/home"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/signup" />}
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/signup" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
