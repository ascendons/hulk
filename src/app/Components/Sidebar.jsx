// Sidebar.jsx
import React from 'react';
import { FaTachometerAlt, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <div className="relative h-screen">
      {/* Sidebar Container */}
      <div
        className="group fixed top-0 left-0 h-full bg-gray-900 text-white transition-transform duration-300 w-16 hover:w-64 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center px-4 py-4">
          <div className="bg-gray-800 p-2 rounded-md">
            <span className="text-lg font-semibold">A</span>
          </div>
          <span className="ml-3 hidden group-hover:block text-lg font-semibold">
            Acet Labs
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow mt-4">
          <ul>
            <li className="py-3 px-4 hover:bg-gray-800 flex items-center">
              <FaTachometerAlt className="text-lg" />
              <span className="ml-4 hidden group-hover:block">Dashboard</span>
            </li>
            <li className="py-3 px-4 hover:bg-gray-800 flex items-center">
              <FaUser className="text-lg" />
              <span className="ml-4 hidden group-hover:block">Profile</span>
            </li>
            <li className="py-3 px-4 hover:bg-gray-800 flex items-center">
              <FaCog className="text-lg" />
              <span className="ml-4 hidden group-hover:block">Settings</span>
            </li>
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-800 mt-4">
          <ul>
            <li className="py-3 px-4 hover:bg-gray-800 flex items-center">
              <FaSignOutAlt className="text-lg" />
              <span className="ml-4 hidden group-hover:block">Logout</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;