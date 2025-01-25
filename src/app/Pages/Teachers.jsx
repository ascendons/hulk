import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config";
import Sidebar from "../Components/Sidebar";

const Teachers = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("Bsc.IT");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Firestore query for the selected department
      const q = query(
        collection(db, "teachersinfo"),
        where("department", "==", selectedDepartment)
      );

      const querySnapshot = await getDocs(q);

      const fetchedTeachers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter teachers based on the search term
      const filteredTeachers = fetchedTeachers.filter(
        (teacher) =>
          teacher.teachername
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          teacher.teacheremail.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setTeachers(filteredTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch teachers on component mount or department change
    fetchTeachers();
  }, [selectedDepartment, searchTerm]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-indigo-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {/* Department Selector */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-blue-600">TEACHERS</h1>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Bsc.IT">Bsc.IT</option>
              <option value="BCOM">BCOM</option>
              <option value="BMS">BMS</option>
              <option value="BBA">BBA</option>
              <option value="BCA">BCA</option>
            </select>
          </div>

          {/* Search & Filter */}
          <div className="bg-white border rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Search & Filter</h2>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search Teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              <button
                onClick={fetchTeachers}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg ml-5 hover:bg-blue-900"
              >
                Fetch
              </button>
            </div>
          </div>

          {/* Teachers Table */}
          {loading ? (
            <p>Loading...</p>
          ) : teachers.length > 0 ? (
            <table className="w-full bg-white border rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Phone</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b">
                    <td className="py-2 px-4">{teacher.teachername}</td>
                    <td className="py-2 px-4">{teacher.teacheremail}</td>
                    <td className="py-2 px-4">{teacher.phonenumber}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => console.log("View Profile", teacher.id)}
                        className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition duration-200"
                      >
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
    </div>
  );
};

export default Teachers;
