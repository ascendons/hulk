import React, { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import Sidebar from "../Components/Sidebar";
import { db } from "../../config";
import { DEPARTMENTS } from "../constants";

const Teachers = () => {
  const [selectedDepartment, setSelectedDepartment] = useState(DEPARTMENTS[0]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching teachers for department:", selectedDepartment);

      // Step 1: Fetch teacher details from the `teachersinfo` collection
      const teachersInfoQuery = query(
        collection(db, "teachersinfo"),
        where("department", "==", selectedDepartment)
      );
      const teachersInfoSnapshot = await getDocs(teachersInfoQuery);
      console.log("Teachers Info Snapshot:", teachersInfoSnapshot.docs);

      // Step 2: Fetch teacher names from the `users` collection
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "teacher")
      );
      const usersSnapshot = await getDocs(usersQuery);
      console.log("Users Snapshot:", usersSnapshot.docs);

      // Step 3: Combine data from both collections
      const fetchedTeachers = teachersInfoSnapshot.docs.map(
        (teacherInfoDoc) => {
          const teacherInfoData = teacherInfoDoc.data();

          // Find the corresponding user document using `userId`
          const userDoc = usersSnapshot.docs.find(
            (userDoc) => userDoc.id === teacherInfoData.userId
          );

          return {
            id: teacherInfoDoc.id,
            teachername: userDoc ? userDoc.data().name : "Unknown",
            teacheremail: userDoc ? userDoc.data().email : "Unknown",
            ...teacherInfoData,
          };
        }
      );

      console.log("Fetched Teachers Before Filtering:", fetchedTeachers);

      // Step 4: Filter teachers based on search term
      if (searchTerm) {
        const filteredTeachers = fetchedTeachers.filter(
          (teacher) =>
            teacher.teachername
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            teacher.teacheremail
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
        console.log("Fetched Teachers After Filtering:", filteredTeachers);
        setTeachers(filteredTeachers);
      } else {
        setTeachers(fetchedTeachers);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      alert("An error occurred while fetching teachers.");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, searchTerm]);

  const handleSeeListClick = () => {
    fetchTeachers();
  };

  const handleViewProfile = (teacherId) => {
    console.log("View profile for teacher ID:", teacherId);
    alert(`View Profile for Teacher ID: ${teacherId}`);
  };

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-indigo-800 text-white h-screen transition-all duration-300 overflow-x-hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-5xl font-bold mb-8 text-green-500">TEACHERS</h1>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Search & Filter Secxtion */}
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
                onClick={handleSeeListClick}
                className="bg-green-600 text-white px-5 py-2 rounded-lg ml-5 hover:bg-green-700"
              >
                Fetch
              </button>
            </div>
          </div>

          {/* Teachers Table */}
          {loading ? (
            <div className="flex justify-center items-center">
              <p className="text-blue-600 text-lg font-semibold">Loading...</p>
            </div>
          ) : teachers.length > 0 ? (
            <table className="w-full bg-white border rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Phone</th>
                  <th className="py-2 px-4 text-left">Action</th>
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
                        onClick={() => handleViewProfile(teacher.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600 text-lg">
              No teachers found for the selected filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teachers;
