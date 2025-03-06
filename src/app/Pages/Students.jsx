import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth";
import { db, auth } from "../../config";
import { AuthContext } from "../../authContext";
import Sidebar from "../Components/Sidebar";
import { ArrowLeftIcon } from "@heroicons/react/solid";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const Students = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user || !user.uid) {
        console.log("User data unavailable:", user);
        alert("User not authenticated or data missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = {
            name: doc.data().name || "N/A",
            email: doc.data().email || "N/A",
          };
        });
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => {
          const studentData = doc.data();
          const userId = studentData.userId;
          return {
            id: doc.id,
            name: usersData[userId]?.name || "N/A",
            email: usersData[userId]?.email || "N/A",
            phonenumber: studentData.phonenumber || "N/A",
            course: studentData.course || "N/A",
            division: studentData.division || "N/A",
            year: studentData.year || "N/A",
            studentid: studentData.studentid || "N/A",
            userId,
          };
        });
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        alert("Failed to fetch students: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user]);

  const filteredStudents = students.filter((student) =>
    Object.values(student).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-blue-800 text-white h-screen fixed top-0 left-0 overflow-y-auto">
        <Sidebar />
      </div>
      <div className="flex-grow ml-64 p-6">
        {/* <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button> */}
        <h1 className="text-5xl font-bold text-green-500 mb-6">SEE STUDENTS</h1>
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 text-base border-2 border-gray-300 rounded-lg"
            disabled={loading}
          />
        </div>
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <Skeleton height={30} width={150} className="mb-4" />
            <Skeleton count={3} />
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    NAME
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    EMAIL
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    PHONE
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    COURSE
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    DIVISION
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    YEAR
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    STUDENT ID
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="border border-gray-300 p-2">
                        {student.name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {student.email}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {student.phonenumber}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {student.course}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {student.division}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {student.year}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {student.studentid}
                      </td>
                      <td className="border border-gray-300 p-2 flex space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/view-profile/${student.id}`)
                          }
                          disabled={loading}
                          className="bg-blue-500 text-white px-2.5 py-1 rounded cursor-pointer text-sm hover:bg-blue-600"
                        >
                          ViewDetails
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="border border-gray-300 p-2 text-center text-gray-600"
                    >
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
