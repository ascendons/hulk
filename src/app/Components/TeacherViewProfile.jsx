import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../config";

const TeacherViewProfile = () => {
  const { teacherId } = useParams(); // Extract teacherId from the URL
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const role = userDoc.data().role.toLowerCase();
            setUserRole(role);
            console.log("Current user role:", role);

            // Check if user is either teacher or admin
            if (role !== "teacher" && role !== "admin") {
              console.log("User is not a teacher or admin. Role is:", role);
              navigate("/admin"); // Redirect if not authorized
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setError("Failed to verify user role: " + error.message);
        }
      } else {
        navigate("/signup"); // Redirect if not authenticated
      }
    });

    const fetchTeacher = async () => {
      try {
        console.log("Fetching teacher with ID:", teacherId); // Debug log
        const teacherDoc = await getDoc(doc(db, "teachersinfo", teacherId));
        if (teacherDoc.exists()) {
          setTeacher(teacherDoc.data());
        } else {
          setError("Teacher not found");
        }
      } catch (error) {
        console.error("Error fetching teacher:", error);
        setError("Failed to load teacher details: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
    return () => unsubscribeAuth();
  }, [teacherId, navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!teacher) return <div>No teacher data available</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Teacher Details</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <p>
          <strong>Name:</strong> {teacher.name || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {teacher.email || "N/A"}
        </p>
        <p>
          <strong>Phone:</strong> {teacher.phone || "N/A"}
        </p>
        <p>
          <strong>Department:</strong> {teacher.department || "N/A"}
        </p>
        <p>
          <strong>Teacher ID:</strong>{" "}
          {teacher.teacherId || teacher.id || "N/A"}
        </p>
        {/* Add more fields as needed */}
        <button
          onClick={() => navigate("/adminteachers")}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Teachers
        </button>
      </div>
    </div>
  );
};

export default TeacherViewProfile;
