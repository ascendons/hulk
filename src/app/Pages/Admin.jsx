import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // For navigation
import {
  UserAddIcon,
  UsersIcon,
  BookOpenIcon,
  UserIcon,
  AcademicCapIcon,
} from "@heroicons/react/solid"; // Example Heroicons

const Admin = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Placeholder for handling add actions (can be expanded later)
  const handleAdd = (type) => {
    setMessage(`${type} functionality is not yet implemented.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-8 text-blue-600">ADMIN PANEL</h1>

      {/* Message/Notification */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
          <button
            className="ml-4 text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setMessage("")}
          >
            Close
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Teacher Card */}
        <Link
          to="/create-account"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <UserAddIcon className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Add Teacher</h2>
        </Link>

        {/* Add Students Card */}
        <Link
          to="/add-students"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <UsersIcon className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Add Students</h2>
        </Link>

        {/* Add Subjects Card */}
        <div
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => handleAdd("Add Subjects")}
        >
          <BookOpenIcon className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Add Subjects</h2>
        </div>

        {/* See Students Card */}
        <Link
          to="/adminstudents"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <UsersIcon className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Students</h2>
        </Link>

        {/* See Teachers Card */}
        <Link
          to="/adminteachers"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <UserIcon className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Teachers</h2>
        </Link>

        {/* Add Timetable Card */}
        <Link
          to="/edit-timetable"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <AcademicCapIcon className="h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Add Timetable</h2>
        </Link>
      </div>
    </div>
  );
};

export default Admin;
