import React from "react";
import Sidebar from "../Components/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar className="w-1/5 bg-gray-800 text-white h-full" />

      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <input
            type="text"
            placeholder="Search"
            className="border rounded-lg px-4 py-2 w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </header>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-purple-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Total Students</h2>
            <p className="text-3xl font-bold">1220</p>
          </div>
          <div className="bg-red-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Total Teachers</h2>
            <p className="text-3xl font-bold">120</p>
          </div>
          <div className="bg-blue-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Total Courses</h2>
            <p className="text-3xl font-bold">15</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold">Faculty Room</h2>
            <p className="text-3xl font-bold">100</p>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Statistics Chart */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <p>Graph/Chart Placeholder</p>
          </div>

          {/* Course Activities */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold mb-4">Course Activities</h2>
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <p className="text-2xl font-bold">75%</p>
            </div>
            <p className="text-gray-600 mt-2">Process</p>
          </div>
        </div>

        {/* Database Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Database</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Score</th>
                <th className="p-2 border">Submitted</th>
                <th className="p-2 border">Teacher</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Pass/Fail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border">Glenn Maxwell</td>
                <td className="p-2 border">80/100</td>
                <td className="p-2 border">12/10/22-10 PM</td>
                <td className="p-2 border">Excellent</td>
                <td className="p-2 border">A</td>
                <td className="p-2 border text-green-600">Pass</td>
              </tr>
              <tr>
                <td className="p-2 border">Cathe Heavan</td>
                <td className="p-2 border">70/100</td>
                <td className="p-2 border">12/10/22-10 PM</td>
                <td className="p-2 border">Average</td>
                <td className="p-2 border">B</td>
                <td className="p-2 border text-green-600">Pass</td>
              </tr>
              <tr>
                <td className="p-2 border">Yeodar Gil</td>
                <td className="p-2 border">35/100</td>
                <td className="p-2 border">12/10/22-10 PM</td>
                <td className="p-2 border">Poor</td>
                <td className="p-2 border">C</td>
                <td className="p-2 border text-red-600">Fail</td>
              </tr>
              <tr>
                <td className="p-2 border">Preeth Shing</td>
                <td className="p-2 border">80/100</td>
                <td className="p-2 border">12/10/22-10 PM</td>
                <td className="p-2 border">Excellent</td>
                <td className="p-2 border">A</td>
                <td className="p-2 border text-green-600">Pass</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/4 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4">Calendar</h2>
        <p>Calendar Placeholder</p>

        <h2 className="text-lg font-semibold mt-6 mb-4">Notice Board</h2>
        <ul>
          <li className="mb-4">
            <h3 className="font-medium">Special Examination</h3>
            <p className="text-sm text-gray-600">By Justin Langer</p>
          </li>
          <li className="mb-4">
            <h3 className="font-medium">Semester Admission</h3>
            <p className="text-sm text-gray-600">By Daniel Vatory</p>
          </li>
          <li>
            <h3 className="font-medium">COVID-19 Vaccination</h3>
            <p className="text-sm text-gray-600">By Jacob Oram</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
