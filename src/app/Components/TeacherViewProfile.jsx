import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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

const TeacherViewProfile = () => {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const navigate = useNavigate();

  // Function to extract public ID from a full Cloudinary URL
  const getPublicIdFromUrl = (url) => {
    if (!url) return "";
    const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const match = url.match(regex);
    return match ? match[1] : url; // Returns public ID (e.g., "teacher_profiles/ii4okko57kgijjydthjq") or original string if no match
  };

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
        const userId = userData.userId || user.uid;
        if (!userId) {
          console.error("No userId found in user data.");
          setErrorMessage("No userId found in user data.");
          setLoading(false);
          return;
        }

        const userRole = userData.role ? userData.role.toLowerCase() : "";
        if (userRole !== "teacher") {
          console.error("User is not a teacher. Role is:", userRole);
          navigate("/dashboard");
          setErrorMessage(`User role '${userRole}' is not a teacher.`);
          return;
        }

        const teacherQuery = query(
          collection(db, "teachersinfo"),
          where("userId", "==", userId)
        );
        const teacherSnapshot = await getDocs(teacherQuery);

        if (teacherSnapshot.empty) {
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
            profilePhotoUrl: "",
          });
        } else {
          const teacherData = teacherSnapshot.docs[0].data();
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
            profilePhotoUrl: teacherData.profilePhotoUrl || "",
          });
          setProfilePhotoUrl(teacherData.profilePhotoUrl || "");
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
      formData.append("upload_preset", "teachers_profile");
      formData.append("folder", "teacher_profiles");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      const teacherRef = doc(db, "teachersinfo", teacherInfo.userId);
      await updateDoc(teacherRef, { profilePhotoUrl: imageUrl });

      setTeacherInfo((prev) => ({ ...prev, profilePhotoUrl: imageUrl }));
      setProfilePhotoUrl(imageUrl);
      setErrorMessage("");
    } catch (error) {
      console.error("Image upload error:", error);
      setErrorMessage(`Failed to upload image: ${error.message}`);
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

  if (!teacherInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-xl font-semibold">
          {errorMessage || "Unable to fetch teacher info. Please try again later."}
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

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 shadow-md border-2 border-blue-300">
              {profilePhotoUrl ? (
                <AdvancedImage
                  cldImg={cld.image(getPublicIdFromUrl(profilePhotoUrl))
                    .resize(fill().width(150).height(150).gravity(autoGravity()))
                    .format("auto")
                    .quality("auto")}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-gray-500 font-bold text-lg">IMG</span>
              )}
              <label
                htmlFor="profilePhoto"
                className={`absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {uploading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    Uploading
                  </span>
                ) : (
                  "Upload"
                )}
              </label>
              <input
                type="file"
                id="profilePhoto"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{teacherInfo.name}</h2>
          </div>

          <div className="w-full md:w-2/3">
            <div className="space-y-6">
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={teacherInfo.name}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={teacherInfo.email}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-green-500 text-sm ml-2">✔</span>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Number</label>
                <input
                  type="tel"
                  value={teacherInfo.phone || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-green-500 text-sm ml-2">✔</span>
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Teacher ID</label>
                <input
                  type="text"
                  value={teacherInfo.teacherId || "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Role</label>
                <input
                  type="text"
                  value={teacherInfo.role}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Department</label>
                <input
                  type="text"
                  value={teacherInfo.department}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Divisions</label>
                <input
                  type="text"
                  value={Array.isArray(teacherInfo.divisions) ? teacherInfo.divisions.join(", ") || "N/A" : "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-600 font-medium mb-2">Subjects</label>
                <input
                  type="text"
                  value={Array.isArray(teacherInfo.subjects) ? teacherInfo.subjects.join(", ") || "N/A" : "N/A"}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        userId={teacherInfo.userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TeacherViewProfile;