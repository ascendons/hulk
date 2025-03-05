import React, { useState, useEffect } from "react";
import { db } from "../../config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../config";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import Heroicons for back arrow

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Add useNavigate for navigation

  useEffect(() => {
    const fetchTeachers = async () => {
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
  }, []);

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

      console.log("Attempting to delete user with UID:", userId); // Debug log

      // 1. Delete from teachersinfo collection
      await deleteDoc(doc(db, "teachersinfo", teacherId));
      console.log("Deleted from teachersinfo");

      // 2. Delete from users collection
      await deleteDoc(doc(db, "users", userId));
      console.log("Deleted from users");

      // 3. Delete from Firebase Authentication
      const deleteFirebaseUser = httpsCallable(functions, "deleteFirebaseUser");
      const result = await deleteFirebaseUser({ uid: userId });

      console.log("Cloud Function response:", result); // Debug log

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

  const handleViewDetail = (teacherId) => {
    console.log("Navigating to teacher detail with ID:", teacherId); // Debug log
    // Navigate to the TeacherViewProfile with the teacher's ID
    navigate(`/view-profile/teacher/${teacherId}`);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    Object.values(teacher).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div
      className="p-5 border-2 border-black rounded-lg mx-5 my-5 font-sans" // Tailwind CSS for styling
    >
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate("/admin")} // Redirect to /admin (Admin.jsx)
        className="mb-4 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
      </button>

      <h1 className="text-center text-2xl font-bold mb-5">SEE TEACHERS</h1>
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 text-base border-2 border-black rounded-lg"
          disabled={loading}
        />
      </div>
      {loading && <p className="text-center">Loading...</p>}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-black p-2 bg-gray-200 text-left">
              NAME
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              EMAIL
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              PHONE
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              DEPARTMENT
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              TEACHER ID
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              ACTION
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map((teacher) => (
            <tr key={teacher.id}>
              <td className="border border-black p-2">{teacher.name}</td>
              <td className="border border-black p-2">{teacher.email}</td>
              <td className="border border-black p-2">{teacher.phone}</td>
              <td className="border border-black p-2">{teacher.department}</td>
              <td className="border border-black p-2">{teacher.teacherId}</td>
              <td className="border border-black p-2 flex space-x-2">
                <button
                  onClick={() => handleViewDetail(teacher.id)}
                  disabled={loading}
                  className="bg-blue-500 text-white px-2.5 py-1 rounded cursor-pointer text-sm hover:bg-blue-600"
                >
                  View Detail
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  disabled={loading}
                  className="bg-red-500 text-white px-2.5 py-1 rounded cursor-pointer text-sm hover:bg-red-600"
                >
                  DELETE
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTeachers;
