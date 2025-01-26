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
import { db } from "../../config"; // Adjust based on your Firebase config file path
import Sidebar from "../Components/Sidebar"; // Import Sidebar component
import { useNavigate } from "react-router-dom";

const Students = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // State for Sidebar hover
  const [showList, setShowList] = useState(false); // State to toggle student list
  const [selectedClass, setSelectedClass] = useState(""); // State for selected class
  const [selectedDivision, setSelectedDivision] = useState(""); // State for selected division
  const [selectedYear, setSelectedYear] = useState(""); // State for selected year
  const [classes, setClasses] = useState([]); // State to store unique classes
  const [divisions, setDivisions] = useState([]); // State to store unique divisions
  const [years, setYears] = useState([]); // State to store unique years
  const [students, setStudents] = useState([]); // State to store student data
  const [loading, setLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate(); // Navigation hook

  // Fetch user data and set default values
  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.department === "Bsc.IT") {
              setSelectedClass("Bsc.IT");
              setSelectedDivision("A");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Fetch dropdown options
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const studentData = querySnapshot.docs.map((doc) => doc.data());

        const uniqueClasses = [
          ...new Set(studentData.map((item) => item.studentcourse)),
        ];
        const uniqueDivisions = [
          ...new Set(studentData.map((item) => item.division)),
        ];
        const uniqueYears = [
          ...new Set(studentData.map((item) => item.studentyear)),
        ];

        setClasses(uniqueClasses);
        setDivisions(uniqueDivisions);
        setYears(uniqueYears);

        // Set default dropdown values
        if (!selectedClass) setSelectedClass(uniqueClasses[0] || "");
        if (!selectedDivision) setSelectedDivision(uniqueDivisions[0] || "");
        if (!selectedYear) setSelectedYear(uniqueYears[0] || "");
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, [selectedClass, selectedDivision, selectedYear]);

  // Fetch students based on filters
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "students"),
        where("studentcourse", "==", selectedClass),
        where("division", "==", selectedDivision),
        where("studentyear", "==", selectedYear)
      );
      const querySnapshot = await getDocs(q);
      const fetchedStudents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeListClick = () => {
    fetchStudents();
    setShowList(true);
  };

  const handleProfileClick = (studentId) => {
    navigate(`/profile/${studentId}`); // Navigate to student profile
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
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold mb-8 text-blue-600">STUDENTS</h1>
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handleSeeListClick}
              className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700"
            >
              SEE LIST
            </button>
          </div>
        </div>

        {showList && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">
              Students in {selectedClass}, Division {selectedDivision},{" "}
              {selectedYear}
            </h2>
            {loading ? (
              <p>Loading...</p>
            ) : students.length > 0 ? (
              <table className="w-full bg-white border rounded-lg shadow-md text-left">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Roll No</th>
                    <th className="py-2 px-4">Email</th>
                    <th className="py-2 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b">
                      <td className="py-2 px-4">{student.studentname}</td>
                      <td className="py-2 px-4">{student.studentrollno}</td>
                      <td className="py-2 px-4">{student.studentemail}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleProfileClick(student.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          See Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                No students found for the selected class, division, and year.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
