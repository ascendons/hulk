import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../config";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const TeacherViewProfile = () => {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);
  const [attendance] = useState(85);

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name || name === "N/A") return "N/A";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  // Array of background colors for initials avatar
  const backgroundColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-gray-500",
    "bg-indigo-500",
  ];

  // Select random background color
  const randomColor =
    backgroundColors[Math.floor(Math.random() * backgroundColors.length)];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPEG, PNG, and JPG files are allowed.");
      setShowUploadErrorModal(true);
      return;
    }
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB.");
      setShowUploadErrorModal(true);
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "teachers_profiles");
      formData.append("cloud_name", "dwdejk1u3");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dwdejk1u3/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `Cloudinary upload failed: ${response.status} - ${
            data.error?.message || "Unknown error"
          }`
        );
      }

      if (data.secure_url) {
        const teacherInfoDocRef = doc(db, "teachersinfo", teacherId);
        try {
          await updateDoc(teacherInfoDocRef, {
            profilePhotoUrl: data.secure_url,
          });
        } catch (firestoreError) {
          throw new Error(
            "Failed to update Firestore (teachersinfo): " +
              firestoreError.message
          );
        }

        setTeacher((prev) => {
          const updatedTeacher = {
            ...prev,
            profilePhotoUrl: data.secure_url,
          };
          console.log("Updated teacher state:", updatedTeacher);
          return updatedTeacher;
        });
      } else {
        throw new Error("No secure URL returned from Cloudinary.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(`Failed to upload image: ${error.message}`);
      setShowUploadErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!db) {
      setError("Firestore database is not initialized.");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const role = userDoc.data().role.toLowerCase();
            setUserRole(role);
            if (role !== "teacher" && role !== "admin") {
              navigate("/admin");
              return;
            }
          } else {
            setError("User document not found.");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setError("Failed to verify user role: " + error.message);
        }
      } else {
        navigate("/signup");
      }
    });

    const fetchTeacher = async () => {
      try {
        const userDocRef = doc(db, "users", teacherId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("Teacher not found in users collection");
          return;
        }

        const userData = userDoc.data();

        let teacherInfoData = {};
        const teacherInfoDocRef = doc(db, "teachersinfo", teacherId);
        const teacherInfoDoc = await getDoc(teacherInfoDocRef);

        if (teacherInfoDoc.exists()) {
          teacherInfoData = teacherInfoDoc.data();
        }

        setTeacher({
          name: userData.name || "N/A",
          email: userData.email || "N/A",
          role: userData.role || "N/A",
          phone: teacherInfoData.phone || "N/A",
          department: teacherInfoData.department || "N/A",
          teacherId: teacherInfoData.teacherId || teacherId || "N/A",
          profilePhotoUrl:
            teacherInfoData.profilePhotoUrl || userData.profilePhotoUrl || "",
        });
      } catch (error) {
        setError("Failed to load teacher details: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
    return () => unsubscribeAuth();
  }, [teacherId, navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!auth.currentUser) {
      setFormError("No authenticated user found.");
      return;
    }

    if (newPassword.length <= 10) {
      setFormError("Password must be more than 10 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFormError("New password and confirm password do not match.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setShowModal(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setFormError(
        error.code === "auth/wrong-password"
          ? "Current password is incorrect."
          : "Failed to update password: " + error.message
      );
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-red-500 text-lg font-bold">{error}</p>
      </div>
    );
  if (!teacher)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-600 text-lg">No teacher data available</p>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1 p-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 shadow-xl rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-gray-200">
          <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-green-200 shadow-md">
            {teacher.profilePhotoUrl ? (
              <img
                src={teacher.profilePhotoUrl}
                alt={`${teacher.name}'s profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/128";
                }}
              />
            ) : (
              <div
                className={`w-full h-full ${randomColor} flex items-center justify-center text-white text-4xl font-semibold`}
              >
                {getInitials(teacher.name)}
              </div>
            )}
            <label
              htmlFor="profile-upload"
              className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 cursor-pointer shadow-lg hover:bg-green-600 hover:scale-110 transition-transform duration-300"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-full">
                <svg
                  className="w-8 h-8 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{teacher.name}</h2>
            <p className="text-gray-600 text-sm mt-1">{teacher.email}</p>
            <p className="text-gray-600 text-sm mt-1">
              Department: {teacher.department}
            </p>
            <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs mt-2 font-medium shadow-sm">
              {teacher.role.charAt(0).toUpperCase() + teacher.role.slice(1)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-6">
            {["Details", "Security", "Payment", "Analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          {activeTab === "Details" && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Teacher Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Name:</strong>{" "}
                    {teacher.name}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Email:</strong>{" "}
                    {teacher.email}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Phone:</strong>{" "}
                    {teacher.phone}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Department:</strong>{" "}
                    {teacher.department}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Teacher ID:</strong>{" "}
                    {teacher.teacherId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/adminteachers")}
                className="mt-6 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition duration-300"
              >
                Back to Teachers
              </button>
            </div>
          )}
          {activeTab === "Security" && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Security</h3>
              <p className="text-gray-600 mb-6">
                Update your password to keep your account secure.
              </p>
              <form
                onSubmit={handlePasswordChange}
                className="space-y-6 max-w-md"
              >
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type={currentPasswordVisible ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPasswordVisible(!currentPasswordVisible)
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6 text-gray-500"
                  >
                    {currentPasswordVisible ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type={newPasswordVisible ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6 text-gray-500"
                  >
                    {newPasswordVisible ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                  {newPassword.length > 0 && newPassword.length <= 10 && (
                    <p className="mt-1 text-sm text-red-500">
                      Password must be more than 10 characters long.
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg pr-10 focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6 text-gray-500"
                  >
                    {currentPasswordVisible ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {formError && (
                  <p className="text-red-500 text-sm">{formError}</p>
                )}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                      setFormError("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
          {activeTab === "Payment" && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Payment</h3>
              <p className="text-gray-600">Payment features coming soon.</p>
            </div>
          )}
          {activeTab === "Analytics" && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Analytics
              </h3>
              <div className="space-y-6">
                {/* Syllabus Analytics */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-lg font-semibold text-blue-600 mb-2">
                    Syllabus
                  </h4>
                  <p className="text-gray-600">
                    <strong>Completed Units:</strong> 12/20 (60%)
                  </p>
                  <p className="text-gray-600">
                    <strong>Pending Units:</strong> 8
                  </p>
                  <button
                    onClick={() => navigate("/syllabus")}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                  >
                    View Syllabus Tracker
                  </button>
                </div>

                {/* Attendance Analytics */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h4 className="text-lg font-semibold text-green-600 mb-2">
                    Attendance
                  </h4>
                  <p className="text-gray-600">
                    <strong>Average Attendance:</strong> {attendance}%
                  </p>
                  <p className="text-gray-600">
                    <strong>Missed Classes:</strong> 3
                  </p>
                  <button
                    onClick={() => navigate("/AttendanceAnalytics")}
                    className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                  >
                    View Attendance Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-96 transform transition-all duration-300 scale-95 hover:scale-100">
            <h3 className="text-lg font-semibold text-green-600 mb-4">
              Password Updated Successfully!
            </h3>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error Popup */}
      {showUploadErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-96 transform transition-all duration-300 scale-95 hover:scale-100">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Image Upload Failed!
            </h3>
            <p className="text-gray-600 mb-6">{uploadError}</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowUploadErrorModal(false);
                  setUploadError("");
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherViewProfile;
