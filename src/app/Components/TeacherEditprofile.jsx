import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../config"; // Adjust the import path as needed

const TeacherEditProfile = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Query the teacher's data based on the logged-in user's email
          const teacherQuery = query(
            collection(db, "teachersinfo"),
            where("teacheremail", "==", user.email)
          );
          const teacherSnapshot = await getDocs(teacherQuery);

          if (!teacherSnapshot.empty) {
            // Set the first matching document as teacher data
            setTeacherData(teacherSnapshot.docs[0].data());
          }
        }
      } catch (error) {
        console.error("Error fetching teacher data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">No teacher data found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Teacher Profile
        </h1>

        {/* Profile Photo */}
        <div className="flex justify-center mb-4">
          <img
            src={teacherData.profilePhoto || "https://via.placeholder.com/150"} // Fallback profile photo
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
          />
        </div>

        {/* Profile Details */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-gray-600 font-semibold">Name:</p>
            <p className="text-gray-800">{teacherData.teachername}</p>
          </div>

          <div className="flex justify-between">
            <p className="text-gray-600 font-semibold">Department:</p>
            <p className="text-gray-800">{teacherData.department}</p>
          </div>

          <div className="flex justify-between">
            <p className="text-gray-600 font-semibold">Phone Number:</p>
            <p className="text-gray-800">{teacherData.phonenumber}</p>
          </div>

          <div>
            <p className="text-gray-600 font-semibold mb-1">Subjects:</p>
            <ul className="list-disc list-inside text-gray-800">
              {teacherData.subjects.map((subject, index) => (
                <li key={index}>{subject}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between">
            <p className="text-gray-600 font-semibold">Teacher ID:</p>
            <p className="text-gray-800">{teacherData.teacherid}</p>
          </div>

          <div>
            <p className="text-gray-600 font-semibold">Class Teacher:</p>
            <p className="text-gray-800">{teacherData.classteacher}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherEditProfile;
