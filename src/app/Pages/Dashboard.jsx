import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config";

const Dashboard = () => {
  const [noticeboard, setNotices] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0); // State for Total Students

  useEffect(() => {
    // Fetch Notices
    const fetchNotices = async () => {
      try {
        const noticesCollection = collection(db, "notices");
        const noticesSnapshot = await getDocs(noticesCollection);
        const noticesList = noticesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotices(noticesList);
      } catch (error) {
        console.log(error);
      }
    };

    // Fetch Total Students
    const fetchTotalStudents = async () => {
      try {
        const studentsCollection = collection(db, "studentinfo");
        const studentsSnapshot = await getDocs(studentsCollection);
        setTotalStudents(studentsSnapshot.size); // Set total count of documents
      } catch (error) {
        console.error("Error fetching student data: ", error);
      }
    };

    fetchNotices();
    fetchTotalStudents();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar className="w-1/5 bg-gray-800 text-white h-full" />

      {/* Main Content */}
      <div className="flex-grow p-6">
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
            <p className="text-3xl font-bold">{totalStudents}</p>
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
        <h2 className="text-lg font-semibold mt-6 mb-4">Notice Board</h2>
        <ul>
          {noticeboard.map((notice) => (
            <li key={notice.id} className="mb-2">
              <h3 className="font-semibold">{notice.title}</h3>
              <p className="text-gray-600">{notice.content}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
