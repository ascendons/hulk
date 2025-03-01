import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar"; // Import Sidebar component

const Attendance = () => {
  const navigate = useNavigate();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Sidebar hover state

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-5xl font-extrabold mb-12 text-blue-700">
          ATTENDANCE
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Mark Attendance Card */}
          <div
            className="bg-white shadow-md hover:shadow-xl transition-shadow rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer border border-gray-200 hover:border-blue-500 transform hover:scale-105 transition-transform"
            onClick={() => navigate("/mark-attendance")}
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v2a2 2 0 002 2h2a2 2 0 002-2v-2M9 11l2 2 4-4M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-700">MARK ATTENDANCE</h2>
          </div>

          {/* See Attendance Card */}
          <div
            className="bg-white shadow-md hover:shadow-xl transition-shadow rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer border border-gray-200 hover:border-green-500 transform hover:scale-105 transition-transform"
            onClick={() => navigate("/see-attendance")}
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h11M9 21l3-6-3-6H3m6 0a9 9 0 110 12z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-700">SEE ATTENDANCE</h2>
          </div>

          {/* Edit Attendance Card */}
          <div
            className="bg-white shadow-md hover:shadow-xl transition-shadow rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer border border-gray-200 hover:border-yellow-500 transform hover:scale-105 transition-transform"
            onClick={() => navigate("/edit-attendance")}
          >
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12h3m-4 2h1m-1-6h.01M11 6h2m-6 6h1m-4 2h1m1-4h2m-6-4h1m3 0h.01M3 6h.01M15 6h1"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-700">EDIT ATTENDANCE</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
