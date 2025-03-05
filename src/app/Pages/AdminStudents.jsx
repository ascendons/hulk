import React, { useState, useEffect } from "react";
import { db } from "../../config"; // Firebase Firestore configuration
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth"; // Firebase Authentication
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import Heroicons for back arrow

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Add useNavigate for navigation

  // Fetch data from both 'users' and 'students' collections
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Fetch users data (for name and email)
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = {};
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = {
            name: doc.data().name || "N/A",
            email: doc.data().email || "N/A",
          };
        });

        // Fetch students data (for other fields)
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => {
          const studentData = doc.data();
          const userId = studentData.userId; // Assuming userId links to the users collection document ID
          return {
            id: doc.id, // Document ID from students collection for viewing
            name: usersData[userId]?.name || "N/A", // Fetch name from users
            email: usersData[userId]?.email || "N/A", // Fetch email from users
            phonenumber: studentData.phonenumber || "N/A",
            course: studentData.course || "N/A",
            division: studentData.division || "N/A",
            year: studentData.year || "N/A",
            studentid: studentData.studentid || "N/A",
            userId: userId, // Store userId for navigation to StudentViewProfile
          };
        });

        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  const handleDelete = async (studentId) => {
    const auth = getAuth();

    try {
      const studentToDelete = students.find(
        (student) => student.id === studentId
      );
      if (!studentToDelete) {
        throw new Error("Student not found");
      }

      const { userId, email } = studentToDelete;
      await deleteDoc(doc(db, "students", studentId));
      if (userId) {
        await deleteDoc(doc(db, "users", userId));
      }

      if (email) {
        const user = auth.currentUser; // Assuming the admin is logged in
        if (user) {
          const users = await auth.listUsers(); // List all users (limited to 1000 by default)
          const userToDelete = users.users.find((u) => u.email === email);
          if (userToDelete) {
            await deleteUser(userToDelete); // Delete the user from Firebase Auth
          } else {
            console.warn(`User with email ${email} not found in Firebase Auth`);
          }
        } else {
          throw new Error("No authenticated user to perform deletion");
        }
      }

      // Update the state to remove the deleted student
      setStudents(students.filter((student) => student.id !== studentId));
      alert(
        "Student deleted successfully from all databases and Firebase Auth!"
      );
    } catch (error) {
      console.error("Error deleting student:", error);
      alert(`Error deleting student: ${error.message}. Please try again.`);
    }
  };

  const filteredStudents = students.filter((student) =>
    Object.values(student).some((value) =>
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

      <h1 className="text-center text-2xl font-bold mb-5">SEE STUDENTS</h1>
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 text-base border-2 border-black rounded-lg"
        />
      </div>
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
              COURSE
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              DIVISION
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              YEAR
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              STUDENT ID
            </th>
            <th className="border border-black p-2 bg-gray-200 text-left">
              ACTION
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id}>
              <td className="border border-black p-2">{student.name}</td>
              <td className="border border-black p-2">{student.email}</td>
              <td className="border border-black p-2">{student.phonenumber}</td>
              <td className="border border-black p-2">{student.course}</td>
              <td className="border border-black p-2">{student.division}</td>
              <td className="border border-black p-2">{student.year}</td>
              <td className="border border-black p-2">{student.studentid}</td>
              <td className="border border-black p-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/view-profile/${student.id}`)} // Navigate to StudentViewProfile with student ID
                    className="bg-blue-500 text-white px-2.5 py-1 rounded cursor-pointer text-sm hover:bg-blue-600"
                  >
                    ViewDetails
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="bg-red-500 text-white px-2.5 py-1 rounded cursor-pointer text-sm hover:bg-red-600"
                  >
                    DELETE
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminStudents;
