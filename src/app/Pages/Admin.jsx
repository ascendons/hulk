import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../config"; // Ensure this points to your Firebase config
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link for navigation

const Admin = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // For potential future navigation if needed

  // Placeholder for navigation or future implementation
  const handleAdd = () => {
    setMessage("Add Subjects functionality is not yet implemented.");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-8 text-blue-600">ADMIN PANEL</h1>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Teacher Card */}
          <Link
            to="/create-account"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Add Teacher
            </h2>
            <p className="text-blue-600 font-medium">Click to add a teacher</p>
          </Link>

          {/* Add Students Card */}
          <Link
            to="/add-students"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Add Students
            </h2>
            <p className="text-blue-600 font-medium">Click to add students</p>
          </Link>

          {/* Add Subjects Card */}
          <Link
            to="/add-subjects"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Add Subjects
            </h2>
            <p className="text-blue-600 font-medium">Click to add subjects</p>
          </Link>
          {/*See Students Card */}
          <Link
            to="/adminstudents"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Students
            </h2>
            <p className="text-blue-600 font-medium">Click to add subjects</p>
          </Link>
          {/*See Teachers Card */}
          <Link
            to="/adminteachers"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Teachers
            </h2>
            <p className="text-blue-600 font-medium">Click to add subjects</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Admin;
