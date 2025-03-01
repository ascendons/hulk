import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../config";
import ChangePasswordModal from "./ChangePasswordModal";

const TeacherViewProfile = () => {
  const [teachersinfo, setTeachersinfo] = useState(null);
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

        // Ensure email is available, fallback to uid if necessary
        const userEmail = user.email || user.uid;
        if (!userEmail) {
          console.error("No email or UID available for the user.");
          setErrorMessage("No email or UID available for the user.");
          setLoading(false);
          return;
        }

        // Fetch user data from the 'users' collection using the user's email
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", userEmail) // Use fallback email or uid
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

        // Ensure userId exists, fallback to a default or uid if missing
        const userId = userData.userId || user.uid || "default-user-id";
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
          where("userId", "==", userId) // Use the ensured userId
        );
        const teachersinfoSnapshot = await getDocs(teacherQuery);

        if (teachersinfoSnapshot.empty) {
          console.error("No teacher profile found for userId:", userId);
          setErrorMessage(`No teacher profile found for userId: ${userId}`);
          // Set fallback data if no teacher info is found
          setTeachersinfo({
            name: userData.name || "Teacher",
            userId: userId,
            email: userEmail,
            role: "Teacher",
            department: "Department",
            phone: "",
            divisions: [],
            subjects: [],
            teacherId: "N/A", // Fallback for teacherId
          });
        } else {
          const teacherData = teachersinfoSnapshot.docs[0].data();
          console.log("Teacher data from 'teachersinfo':", teacherData); // Debug: Log teacher data
          console.log("TeacherId value:", teacherData.teacherId); // Debug: Specifically log teacherId

          // Combine user data and teacher data, with fallbacks
          setTeachersinfo({
            name: teacherData.name || userData.name || "Teacher",
            userId: teacherData.userId || userId || "",
            email: teacherData.email || userEmail || "",
            role: teacherData.role || userData.role || "Teacher",
            department: teacherData.department || "Department",
            phone: teacherData.phone || "", // Match 'phone' from your screenshot
            divisions: teacherData.divisions || [],
            subjects: teacherData.subjects || [],
            teacherId: teacherData.teacherId || "N/A", // Ensure teacherId is correctly set
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

  if (!teachersinfo) {
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
    <div className="flex min-h-screen bg-gray-100">
      <div className="relative bg-white p-6 md:p-10 rounded-lg shadow-2xl max-w-4xl mx-auto my-8 w-full">
        {/* Navigation Buttons */}
        <div className="flex justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors"
          >
            Change Password
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Section (Profile Picture and Name) */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center mb-4 shadow-md">
              <span className="text-gray-500 font-bold text-xl">IMG</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              {teachersinfo.name}
            </h2>
          </div>

          {/* Right Section (Profile Details) */}
          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <p className="text-gray-600 font-medium">Teacher ID:</p>
                <p className="text-gray-900 font-semibold">
                  {teachersinfo.teacherId || "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 font-medium">Email:</p>
                <p className="text-gray-900 font-semibold">
                  {teachersinfo.email}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 font-medium">Phone:</p>
                <p className="text-gray-900 font-semibold">
                  {teachersinfo.phone || "N/A"}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 font-medium">Role:</p>
                <p className="text-gray-900 font-semibold">
                  {teachersinfo.role}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 font-medium">Department:</p>
                <p className="text-gray-900 font-semibold">
                  {teachersinfo.department}
                </p>
              </div>
              <div className="mb-4 col-span-1 md:col-span-2">
                <p className="text-gray-600 font-medium">Divisions:</p>
                <p className="text-gray-900 font-semibold">
                  {Array.isArray(teachersinfo.divisions)
                    ? teachersinfo.divisions.join(", ") || "N/A"
                    : "N/A"}
                </p>
              </div>
              <div className="mb-4 col-span-1 md:col-span-2">
                <p className="text-gray-600 font-medium">Subjects:</p>
                <p className="text-gray-900 font-semibold">
                  {Array.isArray(teachersinfo.subjects)
                    ? teachersinfo.subjects.join(", ") || "N/A"
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        userId={teachersinfo.userId} // Keep userId for the modal if needed
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TeacherViewProfile;
