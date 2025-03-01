import React, { useState, useEffect } from "react";
import { db } from "../../config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../config";

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

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
            id: doc.id,
            name: usersData[userId]?.name || "N/A",
            email: usersData[userId]?.email || "N/A",
            phone: teacherData.phone || "N/A",
            department: teacherData.department || "N/A",
            teacherId: teacherData.teacherId || "N/A",
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

  const filteredTeachers = teachers.filter((teacher) =>
    Object.values(teacher).some((value) =>
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
        SEE TEACHERS
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
          disabled={loading}
        />
      </div>
      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              NAME
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              EMAIL
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              PHONE
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              DEPARTMENT
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              TEACHER ID
            </th>
            <th
              style={{
                border: "1px solid black",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              ACTION
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map((teacher) => (
            <tr key={teacher.id}>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {teacher.name}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {teacher.email}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {teacher.phone}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {teacher.department}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                {teacher.teacherId}
              </td>
              <td style={{ border: "1px solid black", padding: "8px" }}>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  disabled={loading}
                  style={{
                    backgroundColor: "#ff4444",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    opacity: loading ? 0.6 : 1,
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

export default AdminTeachers;
