import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const Teachers = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("BSCIT");
  const [selectedDivision, setSelectedDivision] = useState("A");
  const [selectedYear, setSelectedYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch the logged-in user's department and division
  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(
            doc(db, "teachersinfo", currentUser.uid)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAvailableYears(userData.teachesYears || []);
            setSelectedYear(userData.teachesYears?.[0] || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  // Fetch teachers based on filters
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "teachersinfo"),
        where("department", "==", selectedDepartment),
        where("divisions", "array-contains", selectedDivision),
        where("teachesYears", "array-contains", selectedYear)
      );
      const querySnapshot = await getDocs(q);
      const fetchedTeachers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(fetchedTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeListClick = () => {
    fetchTeachers();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
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
      <div className="flex-1 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Select Filters</h1>
          <div className="flex space-x-4">
            {/* Department Dropdown */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BSCIT">BSCIT</option>
              <option value="BCOM">BCOM</option>
              <option value="BMS">BMS</option>
              <option value="BBA">BBA</option>
              <option value="BCA">BCA</option>
            </select>

            {/* Division Dropdown */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Card Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* See List */}
          <div
            className="bg-white border rounded-lg shadow-md p-6 flex items-center justify-center text-2xl font-bold hover:bg-gray-200 cursor-pointer"
            onClick={handleSeeListClick}
          >
            SEE LIST
          </div>
        </div>

        {/* Teachers List */}
        {loading ? (
          <p>Loading...</p>
        ) : teachers.length > 0 ? (
          <table className="w-full bg-white border rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Phone</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b">
                  <td className="py-2 px-4">{teacher.teachername}</td>
                  <td className="py-2 px-4">{teacher.teacheremail}</td>
                  <td className="py-2 px-4">{teacher.phonenumber}</td>
                  <td className="py-2 px-4">
                    <button className="text-blue-500 underline hover:text-blue-700">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No teachers found for the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default Teachers;
