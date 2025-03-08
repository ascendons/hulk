import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../config";
import { AuthContext } from "../../authContext";
import Sidebar from "../Components/Sidebar"; // Assuming Sidebar for teachers
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import Heroicons for back arrow
import Skeleton from "react-loading-skeleton"; // Import Skeleton component
import "react-loading-skeleton/dist/skeleton.css"; // Import Skeleton CSS

const Teachers = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Assuming AuthContext provides user info
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch teachers data
  useEffect(() => {
    const fetchTeachers = async () => {
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

        const teachersSnapshot = await getDocs(collection(db, "teachersinfo"));
        const teachersData = teachersSnapshot.docs.map((doc) => {
          const teacherData = doc.data();
          const userId = teacherData.userId;
          return {
            id: doc.id, // Firestore document ID
            name: usersData[userId]?.name || "N/A",
            email: usersData[userId]?.email || "N/A",
            phone: teacherData.phone || "N/A",
            department: teacherData.department || "N/A",
            teacherId: teacherData.teacherId || "N/A", // Custom teacher ID if available
            userId,
          };
        });

        setTeachers(teachersData);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        alert("Failed to fetch teachers: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [user]);

  // Handle teacher deletion
  const handleDelete = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher?"))
      return;

    setLoading(true);
    try {
      const teacherToDelete = teachers.find(
        (teacher) => teacher.id === teacherId
      );
      if (!teacherToDelete) throw new Error("Teacher not found");

      const { userId } = teacherToDelete;
      if (!userId) throw new Error("No user ID found for deletion");

      console.log("Attempting to delete user with UID:", userId);

      // 1. Delete from teachersinfo collection
      await deleteDoc(doc(db, "teachersinfo", teacherId));
      console.log("Deleted from teachersinfo");

      // 2. Delete from users collection
      await deleteDoc(doc(db, "users", userId));
      console.log("Deleted from users");

      // 3. Delete from Firebase Authentication
      const deleteFirebaseUser = httpsCallable(functions, "deleteFirebaseUser");
      const result = await deleteFirebaseUser({ uid: userId });

      console.log("Cloud Function response:", result);

      if (!result.data.success) {
        throw new Error(
          result.data.message || "Authentication deletion failed"
        );
      }

      // Update state
      setTeachers(teachers.filter((teacher) => teacher.id !== teacherId));
      alert("Teacher deleted successfully from all systems!");
    } catch (error) {
      console.error("Detailed deletion error:", error);
      alert(`Failed to delete teacher: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to teacher profile
  const handleViewDetail = (teacherId) => {
    console.log("Navigating to teacher detail with ID:", teacherId);
    navigate(`/view-profile/teacher/${teacherId}`);
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) =>
    Object.values(teacher).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-blue-800 text-white h-screen fixed top-0 left-0 overflow-y-auto">
        <Sidebar /> {/* Assuming Sidebar for this role */}
      </div>

      {/* Main Content with margin to account for fixed sidebar */}
      <div className="flex-grow ml-64 p-6">
        {/* Back Arrow Button */}
        {/* <button
          onClick={() => navigate("/dashboard")} // Adjust the route as needed (e.g., to a dashboard)
          className="mb-4 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button> */}

        <h1 className="text-5xl font-bold text-green-500 mb-6">SEE TEACHERS</h1>

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
                    DEPARTMENT
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    TEACHER ID
                  </th>
                  <th className="border border-gray-300 p-2 bg-gray-200 text-left">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="border border-gray-300 p-2">
                        {teacher.name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {teacher.email}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {teacher.phone}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {teacher.department}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {teacher.teacherId}
                      </td>
                      <td className="border border-gray-300 p-2 flex space-x-2">
                        <button
                          onClick={() => handleViewDetail(teacher.id)}
                          disabled={loading}
                          className="bg-green-500 text-white px-2.5 py-1 rounded cursor-pointer text-sm hover:bg-green-600"
                        >
                          View Detail
                        </button>
                        {/* Removed the DELETE button */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="border border-gray-300 p-2 text-center text-gray-600"
                    >
                      No teachers found.
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

export default Teachers;
