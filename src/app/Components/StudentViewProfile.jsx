import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../../config";
import ChangePasswordModal from "./ChangePasswordModal";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

const CLOUD_NAME = "dwdejk1u3";

const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME,
  },
});

const getPublicIdFromUrl = (url) => {
  if (!url) return "";
  const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
  const match = url.match(regex);
  return match ? match[1] : url;
};

const StudentViewProfile = () => {
  const { studentId } = useParams();
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null); // Store the authenticated user's ID
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user is logged in.");
          navigate("/login");
          setErrorMessage("User not authenticated. Please log in.");
          return;
        }

        setCurrentUserId(user.uid); // Store the authenticated user's ID

        let targetUserId = null;
        let targetStudentId = studentId;

        if (!targetStudentId || targetStudentId === ":studentId") {
          const userEmail = user.email || user.uid;
          if (!userEmail) {
            console.error("No email or UID available for the user.");
            setErrorMessage("No email or UID available for the user.");
            setLoading(false);
            return;
          }

          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", userEmail)
          );
          const usersSnapshot = await getDocs(usersQuery);

          if (usersSnapshot.empty) {
            console.error("No user data found for the email/UID:", userEmail);
            setErrorMessage(`No user data found for email/UID: ${userEmail}`);
            setLoading(false);
            return;
          }

          const userData = usersSnapshot.docs[0].data();
          targetUserId = userData.userId || user.uid;
          targetStudentId = user.uid; // Use the UID as the studentId
          if (!targetUserId) {
            console.error("No userId found in user data.");
            setErrorMessage("No userId found in user data.");
            setLoading(false);
            return;
          }

          const userRole = userData.role ? userData.role.toLowerCase() : "";
          setCurrentUserRole(userRole);
          if (userRole !== "student" && userRole !== "admin") {
            console.error("User is not a student or admin. Role is:", userRole);
            navigate("/dashboard");
            setErrorMessage(
              `User role '${userRole}' is not a student or admin.`
            );
            return;
          }
        } else {
          const studentQuery = query(
            collection(db, "students"),
            where("__name__", "==", targetStudentId)
          );
          const studentSnapshot = await getDocs(studentQuery);

          if (studentSnapshot.empty) {
            console.error("No student data found for ID:", targetStudentId);
            setErrorMessage(`No student data found for ID: ${targetStudentId}`);
            setLoading(false);
            return;
          }

          const studentData = studentSnapshot.docs[0].data();
          targetUserId = studentData.userId;

          const userDoc = await getDoc(doc(db, "users", targetUserId));
          if (!userDoc.exists()) {
            console.error(
              "No user data found for userId (document ID):",
              targetUserId
            );
            console.log(
              "Available users in 'users' collection:",
              (await getDocs(collection(db, "users"))).docs.map((doc) => doc.id)
            );
            setErrorMessage(
              `No user data found for userId (document ID): ${targetUserId}`
            );
            setLoading(false);
            return;
          }

          const userData = userDoc.data();
          setCurrentUserRole("student");
        }

        const studentQuery = targetStudentId
          ? query(
              collection(db, "students"),
              where("__name__", "==", targetStudentId)
            )
          : query(
              collection(db, "students"),
              where("userId", "==", targetUserId)
            );
        const studentSnapshot = await getDocs(studentQuery);

        if (studentSnapshot.empty) {
          setStudentInfo({
            name: "Student",
            email: user.email || "N/A",
            userId: targetUserId || targetStudentId,
            phonenumber: "",
            course: "N/A",
            division: "N/A",
            year: "N/A",
            studentid: "N/A",
            rollno: "N/A",
            profilePhotoUrl: "",
          });
        } else {
          const studentData = studentSnapshot.docs[0].data();

          const userDoc = await getDoc(doc(db, "users", studentData.userId));
          if (!userDoc.exists()) {
            console.error(
              "No user data found for userId (document ID):",
              studentData.userId
            );
            setErrorMessage(
              `No user data found for userId (document ID): ${studentData.userId}`
            );
            setLoading(false);
            return;
          }

          const userData = userDoc.data();

          setStudentInfo({
            name: userData.name || "Student",
            email: userData.email || "N/A",
            userId: studentData.userId,
            phonenumber: studentData.phonenumber || "",
            course: studentData.course || "N/A",
            division: studentData.division || "N/A",
            year: studentData.year || "N/A",
            studentid: studentData.studentid || "N/A",
            rollno: studentData.rollno || "N/A",
            profilePhotoUrl: studentData.profilePhotoUrl || "",
          });
          setProfilePhotoUrl(studentData.profilePhotoUrl || "");
        }
      } catch (error) {
        console.error("Error fetching student info:", error);
        setErrorMessage(`Error fetching data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentInfo();
  }, [studentId, navigate]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setErrorMessage("Please select an image file.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image (JPEG, PNG, or GIF)");
      setShowUploadErrorModal(true);
      return;
    }
    if (file.size > maxSize) {
      setErrorMessage("Image size must be less than 5MB");
      setShowUploadErrorModal(true);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "student_profile");
      formData.append("cloud_name", "dwdejk1u3");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to upload image to Cloudinary"
        );
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      const studentRef = doc(db, "students", studentInfo.userId);
      await updateDoc(studentRef, { profilePhotoUrl: imageUrl });

      setStudentInfo((prev) => ({ ...prev, profilePhotoUrl: imageUrl }));
      setProfilePhotoUrl(imageUrl);
      setErrorMessage("");
    } catch (error) {
      console.error("Image upload error:", error);
      setErrorMessage(
        `Failed to upload image: ${error.message}. Please check if the upload preset 'student_profile' is correctly configured in Cloudinary.`
      );
      setShowUploadErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-red-500 text-lg font-bold">
          {errorMessage ||
            "Unable to fetch student info. Please try again later."}
        </p>
      </div>
    );
  }

  // Determine if the profile being viewed is the current user's own profile
  const isOwnProfile = currentUserId === studentInfo.userId;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1 p-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 shadow-xl rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-gray-200">
          <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-orange-200 shadow-md">
            {profilePhotoUrl ? (
              <AdvancedImage
                cldImg={cld
                  .image(getPublicIdFromUrl(profilePhotoUrl))
                  .resize(fill().width(150).height(150).gravity(autoGravity()))
                  .format("auto")
                  .quality("auto")}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/128";
                }}
              />
            ) : (
              <div
                className={`w-full h-full ${randomColor} flex items-center justify-center text-white text-4xl font-semibold`}
              >
                {getInitials(studentInfo.name)}
              </div>
            )}
            {currentUserRole === "student" && isOwnProfile && (
              <label
                htmlFor="profile-upload"
                className="absolute bottom-2 right-2 bg-orange-500 rounded-full p-2 cursor-pointer shadow-lg hover:bg-orange-600 hover:scale-110 transition-transform duration-300"
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
            )}
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={
                uploading || currentUserRole !== "student" || !isOwnProfile
              }
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
            <h2 className="text-2xl font-bold text-gray-900">
              {studentInfo.name}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{studentInfo.email}</p>
            <p className="text-gray-600 text-sm mt-1">
              Course: {studentInfo.course}
            </p>
            <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-xs mt-2 font-medium shadow-sm">
              Student
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
                    ? "border-orange-500 text-orange-600"
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
                Student Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Name:</strong>{" "}
                    {studentInfo.name}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Email:</strong>{" "}
                    {studentInfo.email}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Phone:</strong>{" "}
                    {studentInfo.phonenumber || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Course:</strong>{" "}
                    {studentInfo.course || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Division:</strong>{" "}
                    {studentInfo.division || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Year:</strong>{" "}
                    {studentInfo.year || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Student ID:</strong>{" "}
                    {studentInfo.studentid || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Roll Number:</strong>{" "}
                    {studentInfo.rollno || "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate(
                    currentUserRole === "student"
                      ? "/student-dashboard"
                      : currentUserRole === "admin"
                      ? "/adminstudents"
                      : "/students"
                  )
                }
                className="mt-6 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition duration-300"
              >
                Back to Students
              </button>
            </div>
          )}
          {activeTab === "Security" && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Security</h3>
              <p className="text-gray-600 mb-6">
                Update your password to keep your account secure.
              </p>
              {currentUserRole === "student" && isOwnProfile && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-orange-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-orange-600 transition-colors"
                >
                  Change Password
                </button>
              )}
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
              <p className="text-gray-600">Analytics features coming soon.</p>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal
        userId={studentInfo.userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Upload Error Popup */}
      {showUploadErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-96 transform transition-all duration-300 scale-95 hover:scale-100">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Image Upload Failed!
            </h3>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowUploadErrorModal(false);
                  setErrorMessage("");
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

export default StudentViewProfile;
