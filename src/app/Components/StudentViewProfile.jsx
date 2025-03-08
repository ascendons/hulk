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

// Function to extract public ID from a full Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return "";
  const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
  const match = url.match(regex);
  return match ? match[1] : url; // Returns public ID or original string if no match
};

const StudentViewProfile = () => {
  const { studentId } = useParams(); // Get optional studentId from URL (document ID from "students")
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState(null); // Track current user's role
  const navigate = useNavigate();

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
          // If no studentId in URL, use the current user's email/uid (for students or admins viewing their own profile)
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
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image (JPEG, PNG, or GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "students_profile"); // Ensure this matches your Cloudinary upload preset
      formData.append("folder", "student_profiles");

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

      // Update Firestore with the new image URL
      const studentRef = doc(db, "students", studentInfo.userId);
      await updateDoc(studentRef, { profilePhotoUrl: imageUrl });

      setStudentInfo((prev) => ({ ...prev, profilePhotoUrl: imageUrl }));
      setProfilePhotoUrl(imageUrl);
      setErrorMessage(""); // Clear any previous error message
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600 text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-xl font-semibold">
          {errorMessage ||
            "Unable to fetch student info. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg w-full max-w-4xl">
          {errorMessage}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl p-8 border border-gray-200">
        <div className="flex justify-between mb-8">
          <button
            onClick={
              () =>
                navigate(
                  currentUserRole === "student"
                    ? "/student-dashboard"
                    : currentUserRole === "admin"
                    ? "/adminstudents"
                    : "/students"
                ) // Dynamic back navigation based on role
            }
            className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-gray-300 transition-colors"
          >
            Back To Home
          </button>
          {currentUserRole === "student" &&
            !studentId && ( // Only show Change Password for the student's own profile (no studentId in URL)
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-red-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-red-600 transition-colors"
              >
                Change Password
              </button>
            )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 shadow-md border-2 border-blue-300">
              {profilePhotoUrl ? (
                <AdvancedImage
                  cldImg={cld
                    .image(getPublicIdFromUrl(profilePhotoUrl))
                    .resize(
                      fill().width(150).height(150).gravity(autoGravity())
                    )
                    .format("auto")
                    .quality("auto")}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-gray-500 font-bold text-lg">IMG</span>
              )}
              {currentUserRole === "student" &&
                !studentId && ( // Only allow upload for the student's own profile
                  <label
                    htmlFor="profilePhoto"
                    className={`absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors ${
                      uploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                        </svg>
                        Uploading
                      </span>
                    ) : (
                      "Upload"
                    )}
                  </label>
                )}
              <input
                type="file"
                id="profilePhoto"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={
                  uploading || currentUserRole !== "student" || !!studentId
                }
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {studentInfo.name}
            </h2>
          </div>

          <div className="w-full md:w-2/3">
            <div className="space-y-6">
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={studentInfo.name}
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
                  value={studentInfo.email}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-green-500 text-sm ml-2">✔</span>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={studentInfo.phonenumber || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-green-500 text-sm ml-2">✔</span>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Course
                </label>
                <input
                  type="text"
                  value={studentInfo.course || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Division
                </label>
                <input
                  type="text"
                  value={studentInfo.division || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Year
                </label>
                <input
                  type="text"
                  value={studentInfo.year || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  value={studentInfo.studentid || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={studentInfo.rollno || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
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
