import React, { useState, useEffect } from "react";
import { db } from "../../config"; // Firebase Firestore configuration
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth"; // Firebase Authentication

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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
            id: doc.id, // Document ID from students collection for deletion
            name: usersData[userId]?.name || "N/A", // Fetch name from users
            email: usersData[userId]?.email || "N/A", // Fetch email from users
            phonenumber: studentData.phonenumber || "N/A",
            course: studentData.course || "N/A",
            division: studentData.division || "N/A",
            year: studentData.year || "N/A",
            studentid: studentData.studentid || "N/A",
            userId: userId, // Store userId for deletion from users collection and Auth
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
      style={{
        padding: "20px",
        border: "2px solid #000",
        borderRadius: "5px",
        margin: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        SEE STUDENTS
      </h1>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            border: "2px solid #000",
            borderRadius: "5px",
          }}
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              NAME
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              EMAIL
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              PHONE
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              COURSE
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              DIVISION
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              YEAR
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              STUDENT ID
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f2f2f2",
                textAlign: "left",
              }}
            >
              ACTION
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id}>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.name}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.email}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.phonenumber}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.course}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.division}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.year}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {student.studentid}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                <button
                  onClick={() => handleDelete(student.id)}
                  style={{
                    backgroundColor: "#ff4444",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
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

export default AdminStudents;
