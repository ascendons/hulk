import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../config";
import ChangePasswordModal from "./ChangePasswordModal";

const TeacherViewProfile = () => {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user is logged in.");
          navigate("/login");
          setErrorMessage("User not authenticated. Please log in.");
          return;
        }

        console.log("Authenticated user:", {
          uid: user.uid,
          email: user.email, // Debug: Check if email exists
        }); // Debug: Log detailed user info

        // Fetch user data from the 'users' collection using the user's email
        const userEmail = user.email || user.uid;
        if (!userEmail) {
          console.error("No email or UID available for the user.");
          setErrorMessage("No email or UID available for the user.");
          setLoading(false);
          return;
        }

        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", userEmail) // Use email to query users
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
          console.error("No user data found for the email/UID:", userEmail);
          setErrorMessage(`No user data found for email/UID: ${userEmail}`);
          setLoading(false);
          return;
        }

        const userData = usersSnapshot.docs[0].data();
        console.log("User data from 'users':", userData); // Debug: Log user data

        const userId = userData.userId || user.uid;
        if (!userId) {
          console.error("No userId found in user data.");
          setErrorMessage("No userId found in user data.");
          setLoading(false);
          return;
        }

        // Check if the user is a teacher (case-insensitive)
        const userRole = userData.role ? userData.role.toLowerCase() : "";
        if (userRole !== "teacher") {
          console.error("User is not a teacher. Role is:", userRole);
          navigate("/dashboard");
          setErrorMessage(`User role '${userRole}' is not a teacher.`);
          return;
        }

        // Fetch teacher data from 'teachersinfo' using userId
        const teacherQuery = query(
          collection(db, "teachersinfo"),
          where("userId", "==", userId) // Use userId to query teachersinfo
        );
        const teacherSnapshot = await getDocs(teacherQuery);

        if (teacherSnapshot.empty) {
          console.error("No teacher profile found for userId:", userId);
          setErrorMessage(`No teacher profile found for userId: ${userId}`);
          setTeacherInfo({
            name: userData.name || "Teacher",
            userId: userId,
            email: userEmail,
            role: "Teacher",
            department: "Department",
            phone: "",
            divisions: [],
            subjects: [],
            teacherId: "N/A",
          });
        } else {
          const teacherData = teacherSnapshot.docs[0].data();
          console.log("Teacher data from 'teachersinfo':", teacherData); // Debug: Log teacher data

          setTeacherInfo({
            name: teacherData.name || userData.name || "Teacher",
            userId: teacherData.userId || userId,
            email: teacherData.email || userEmail,
            role: teacherData.role || userData.role || "Teacher",
            department: teacherData.department || "Department",
            phone: teacherData.phone || "",
            divisions: teacherData.divisions || [],
            subjects: teacherData.subjects || [],
            teacherId: teacherData.teacherId || "N/A",
          });
        }
      } catch (error) {
        console.error("Error fetching teacher info:", error);
        setErrorMessage(`Error fetching data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherInfo();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600 text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (!teacherInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-xl font-semibold">
          {errorMessage ||
            "Unable to fetch teacher info. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl p-8 border border-gray-200">
        {/* Header with Navigation Buttons */}
        <div className="flex justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-gray-300 transition-colors"
          >
            Back To Home
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-red-600 transition-colors"
          >
            Change Password
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Section (Profile Picture and Name) */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 shadow-md border-2 border-blue-300">
              <span className="text-gray-500 font-bold text-lg">IMG</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {teacherInfo.name}
            </h2>
          </div>

          {/* Right Section (Profile Details) */}
          <div className="w-full md:w-2/3">
            <div className="space-y-6">
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={teacherInfo.name}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={teacherInfo.email}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-green-500 text-sm ml-2">✔</span>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Number
                </label>
                <input
                  type="tel"
                  value={teacherInfo.phone || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-green-500 text-sm ml-2">✔</span>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Teacher ID
                </label>
                <input
                  type="text"
                  value={teacherInfo.teacherId || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={teacherInfo.role}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={teacherInfo.department}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Divisions
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(teacherInfo.divisions)
                      ? teacherInfo.divisions.join(", ") || "N/A"
                      : "N/A"
                  }
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Subjects
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(teacherInfo.subjects)
                      ? teacherInfo.subjects.join(", ") || "N/A"
                      : "N/A"
                  }
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        userId={teacherInfo.userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TeacherViewProfile;
