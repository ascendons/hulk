import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../config";
import ChangePasswordModal from "./ChangePasswordModal";

const TeacherViewProfile = () => {
  const [teachersinfo, setTeachersinfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user is logged in.");
          navigate("/login"); // Redirect to login if user is not authenticated
          return;
        }

        // Fetch user data from the 'users' collection to check the role
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", user.email)
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (!usersSnapshot.empty) {
          const userData = usersSnapshot.docs[0].data();
          if (userData.role === "Teacher") {
            // Fetch teacher data from teachersinfo based on the name
            const teachersinfoQuery = query(
              collection(db, "teachersinfo"),
              where("name", "==", userData.name)
            );
            const teachersinfoSnapshot = await getDocs(teachersinfoQuery);

            if (!teachersinfoSnapshot.empty) {
              const teacher = teachersinfoSnapshot.docs[0].data();
              setTeachersinfo(teacher);
            } else {
              console.error(
                "No teacher profile found for the name:",
                userData.name
              );
            }
          } else {
            console.error("User is not a teacher. Role is:", userData.role);
            navigate("/dashboard"); // Redirect if not a teacher, adjust as needed
          }
        } else {
          console.error("No user data found for the email:", user.email);
        }
      } catch (error) {
        console.error("Error fetching teacher info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherInfo();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!teachersinfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Unable to fetch teacher info. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100">
      <div className="relative bg-white p-10 rounded-lg shadow-xl h-screen w-full">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute top-4 left-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600"
        >
          Back to Dashboard
        </button>

        {/* Change Password Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-4 right-4 bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-600"
        >
          Change Password
        </button>

        <div className="flex gap-8">
          {/* Left Section */}
          <div className="flex-shrink-0 w-1/3 flex flex-col items-center">
            {/* Profile Picture */}
            <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="text-gray-500 font-bold text-xl">IMG</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {teachersinfo.name}
            </h2>
          </div>

          {/* Right Section */}
          <div className="w-2/3">
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Teacher ID:</p>
              <p className="text-gray-900 font-bold">
                {teachersinfo.teacherId}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Email:</p>
              <p className="text-gray-900 font-bold">{teachersinfo.email}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Phone:</p>
              <p className="text-gray-900 font-bold">
                {teachersinfo.phoneNumber}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Role:</p>
              <p className="text-gray-900 font-bold">{teachersinfo.role}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Department:</p>
              <p className="text-gray-900 font-bold">
                {teachersinfo.department}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Divisions:</p>
              <p className="text-gray-900 font-bold">
                {teachersinfo.divisions && teachersinfo.divisions.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Subjects:</p>
              <p className="text-gray-900 font-bold">
                {teachersinfo.subjects && teachersinfo.subjects.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        userId={teachersinfo.teacherId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TeacherViewProfile;
