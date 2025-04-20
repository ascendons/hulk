import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

// Cloudinary setup
const CLOUD_NAME = "dwdejk1u3";
const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME,
  },
});

// Function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return "";
  const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
  const match = url.match(regex);
  return match ? match[1] : url;
};

const NewViewProfile = () => {
  const { studentId } = useParams(); // This will be teacherId or studentId
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get initials from name
  const getInitials = (name) => {
    if (!name || name === "N/A") return "N/A";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if profile data is passed via location.state
        const stateRole = location.state?.role;
        const stateProfile = location.state?.teacher || location.state?.student;

        if (stateProfile && stateRole) {
          setProfile(stateProfile);
          setRole(stateRole);
          setLoading(false);
          return;
        }

        // If no state is passed, fetch from Firebase
        if (!studentId) {
          setError("No profile ID provided.");
          setLoading(false);
          return;
        }

        // Try fetching as a student first
        let profileData, userId, profileRole;
        const studentDocRef = doc(db, "students", studentId);
        const studentDoc = await getDoc(studentDocRef);

        if (studentDoc.exists()) {
          profileData = studentDoc.data();
          userId = profileData.userId;
          profileRole = "student";
        } else {
          // If not a student, try fetching as a teacher
          const teacherDocRef = doc(db, "teachersinfo", studentId);
          const teacherDoc = await getDoc(teacherDocRef);

          if (!teacherDoc.exists()) {
            setError("Profile not found.");
            setLoading(false);
            return;
          }

          profileData = teacherDoc.data();
          userId = profileData.userId;
          profileRole = "teacher";
        }

        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("User data not found for this profile.");
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        let combinedData;

        if (profileRole === "student") {
          combinedData = {
            id: studentId,
            name: userData.name || "N/A",
            email: userData.email || "N/A",
            phonenumber: profileData.phonenumber || "N/A",
            course: profileData.course || "N/A",
            division: profileData.division || "N/A",
            year: profileData.year || "N/A",
            studentid: profileData.studentid || "N/A",
            profilePhotoUrl: profileData.profilePhotoUrl || "",
            role: userData.role || "Student",
          };
        } else {
          combinedData = {
            id: studentId,
            name: userData.name || "N/A",
            email: userData.email || "N/A",
            phone: profileData.phone || "N/A",
            department: profileData.department || "N/A",
            teacherId: profileData.teacherId || "N/A",
            profilePhotoUrl: profileData.profilePhotoUrl || "",
            role: userData.role || "Teacher",
          };
        }

        setProfile(combinedData);
        setRole(profileRole);
      } catch (err) {
        setError("Failed to fetch profile data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [studentId, location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-4 text-red-700 bg-red-100 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-4 text-gray-600">No profile data available.</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white text-gray-900 rounded-lg shadow-lg p-8 w-160">
        {/* Photo Section */}
        <div className="flex justify-center mb-6">
          <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-gray-300">
            {profile.profilePhotoUrl ? (
              <AdvancedImage
                cldImg={cld
                  .image(getPublicIdFromUrl(profile.profilePhotoUrl))
                  .resize(fill().width(200).height(200).gravity(autoGravity()))
                  .format("auto")
                  .quality("auto")}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/160";
                }}
              />
            ) : (
              <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-6xl font-bold border-2 border-gray-200">
                {getInitials(profile.name)}
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="bg-gray-100 rounded-lg p-6 text-base">
          {role === "student" ? (
            <>
              <p className="mb-3">
                <span className="font-bold">STUDENT:</span> {profile.name}
              </p>
              <p className="mb-3">
                <span className="font-bold">EMAIL:</span> {profile.email}
              </p>
              <p className="mb-3">
                <span className="font-bold">PHONE:</span> {profile.phonenumber}
              </p>
              <p className="mb-3">
                <span className="font-bold">DIVISION:</span> {profile.division}
              </p>
              <p className="mb-3">
                <span className="font-bold">COURSE:</span> {profile.course}
              </p>
              <p className="mb-3">
                <span className="font-bold">YEAR:</span> {profile.year}
              </p>
              <p className="mb-3">
                <span className="font-bold">STUDENT ID:</span>{" "}
                {profile.studentid}
              </p>
              <p className="mb-3">
                <span className="font-bold">ROLE:</span> {profile.role}
              </p>
            </>
          ) : (
            <>
              <p className="mb-3">
                <span className="font-bold">TEACHER:</span> {profile.name}
              </p>
              <p className="mb-3">
                <span className="font-bold">EMAIL:</span> {profile.email}
              </p>
              <p className="mb-3">
                <span className="font-bold">PHONE:</span> {profile.phone}
              </p>
              <p className="mb-3">
                <span className="font-bold">DEPARTMENT:</span>{" "}
                {profile.department}
              </p>
              <p className="mb-3">
                <span className="font-bold">TEACHER ID:</span>{" "}
                {profile.teacherId}
              </p>
              <p className="mb-3">
                <span className="font-bold">ROLE:</span> {profile.role}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewViewProfile;
