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
import ChangePasswordModal from "./ChangePasswordModal"; // Adjust the import path as needed
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

const CLOUD_NAME = "dwdejk1u3"; // Match your Cloudinary cloud name

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
  const [currentUserRole, setCurrentUserRole] = useState(null); // Track current user's role
  const [activeTab, setActiveTab] = useState("Details"); // Add tabs like in TeacherViewProfile
  const navigate = useNavigate();
  const [showUploadErrorModal, setShowUploadErrorModal] = useState(false);

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

        let targetUserId = null;
        let targetStudentId = studentId; // Use studentId from URL if provided (document ID)

        if (!targetStudentId) {
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
            navigate("/dashboard"); // Redirect to appropriate dashboard if not a student or admin
            setErrorMessage(
              `User role '${userRole}' is not a student or admin.`
            );
            return;
          }
        } else {
          // If studentId is provided (admin viewing another student's profile), fetch the student's data
          const studentQuery = query(
            collection(db, "students"),
            where("__name__", "==", targetStudentId) // Use studentId as the document ID
          );
          const studentSnapshot = await getDocs(studentQuery);

          if (studentSnapshot.empty) {
            console.error("No student data found for ID:", targetStudentId);
            setErrorMessage(`No student data found for ID: ${targetStudentId}`);
            setLoading(false);
            return;
          }

          const studentData = studentSnapshot.docs[0].data();
          targetUserId = studentData.userId; // Get the userId from the student's document

          // Fetch user data (name and email) from "users" collection using userId (document ID)
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
          setCurrentUserRole("student"); // Assume the viewed student is a student
        }

        // Fetch student data (either for the current user or specific studentId)
        const studentQuery = targetStudentId
          ? query(
              collection(db, "students"),
              where("__name__", "==", targetStudentId) // Use studentId as the document ID
            )
          : query(
              collection(db, "students"),
              where("userId", "==", targetUserId) // Use userId for current user
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

          // Fetch user data (name and email) from "users" collection using userId (document ID)
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
        `Failed to upload image: ${error.message}. Please check if the upload preset 'students_profile' is correctly configured in Cloudinary.`
      );
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1 p-8">
        {/* Header Section */}
        <div className="bg-white shadow-lg rounded-lg p-4 mb-8 flex items-center border border-gray-200">
          <div className="relative w-24 h-24 rounded-full mr-4 border border-orange-300 overflow-hidden flex-shrink-0">
            {profilePhotoUrl ? (
              <AdvancedImage
                cldImg={cld
                  .image(getPublicIdFromUrl(profilePhotoUrl))
                  .resize(fill().width(150).height(150).gravity(autoGravity()))
                  .format("auto")
                  .quality("auto")}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/64";
                }}
              />
            ) : (
              <img
                src="https://via.placeholder.com/64"
                alt={`${studentInfo.name}'s profile`}
                className="w-full h-full object-cover"
              />
            )}
            {currentUserRole === "student" && !studentId && (
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1 cursor-pointer shadow-md hover:bg-orange-600 transition duration-300"
              >
                <svg
                  className="w-4 h-4 text-white"
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
                uploading || currentUserRole !== "student" || !!studentId
              }
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <p className="text-white text-xs">Uploading...</p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {studentInfo.name}
            </h2>
            <p className="text-gray-600 text-sm">{studentInfo.email}</p>
            <p className="text-gray-600 text-sm">
              Course: {studentInfo.course}
            </p>
            <span className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs mt-1">
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
              {currentUserRole === "student" && !studentId && (
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
    </div>
  );
};

export default StudentViewProfile;
