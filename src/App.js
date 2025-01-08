import React, { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./app/Pages/Dashboard"; // Import Dashboard component
import Signuppage from "./app/Pages/Signuppage";
import Courses from "./app/Pages/Courses";

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

        <Route
          path="/home"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/signup" />}
        />
        <Route path="/courses" element={<Courses />} />

        <Route path="*" element={<Navigate to="/signup" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
