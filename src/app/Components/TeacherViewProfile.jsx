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
import { AdvancedImage, CloudinaryImage } from "@cloudinary/react";
import { upload } from "cloudinary";

import { cloudinary } from "../../controllers/cloudinary";

const TeacherViewProfile = () => {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
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
        });

        // Fetch user data from the 'sers' collection using the user's email
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

        const userRole = userData.role ? userData.role.toLowerCase() : "";
        if (userRole !== "teacher") {
          console.error("User is not a teacher. Role is:", userRole);
          navigate("/dashboard");
          setErrorMessage(`User role '${userRole}' is not a teacher.`);
          return;
        }

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
            profilePhotoUrl: "", // Default empty photo URL
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
            profilePhotoUrl: teacherData.profilePhotoUrl || "", // Fetch existing photo URL
          });
          setProfilePhotoUrl(teacherData.profilePhotoUrl || ""); // Set initial photo URL
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
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "teachers_profile"); // Replace with your Cloudinary upload preset

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          cloudinary.config().cloud.cloudName
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      const imageUrl = data.secure_url;

      const teacherRef = doc(db, "teachersinfo", teacherInfo.userId);
      await updateDoc(teacherRef, {
        profilePhotoUrl: imageUrl,
      });

      setTeacherInfo((prev) => ({
        ...prev,
        profilePhotoUrl: imageUrl,
      }));
      setProfilePhotoUrl(imageUrl);

      console.log("Image uploaded successfully. URL:", imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
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
            <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4 shadow-md border-2 border-blue-300">
              {profilePhotoUrl ? (
                <AdvancedImage
                  cldImg={
                    new CloudinaryImage(profilePhotoUrl, {
                      cloudName: cloudinary.config().cloud.cloudName,
                    })
                  }
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-gray-500 font-bold text-lg">IMG</span>
              )}
              <label
                htmlFor="profilePhoto"
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload"}
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
