import React, { useState, useEffect } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../config";
import ChangePasswordModal from "./ChangePasswordModal";

const TeacherViewProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch the first teacher as an example or adjust the query based on your needs
        const teachersQuery = query(collection(db, "teachersinfo"));
        const querySnapshot = await getDocs(teachersQuery);

        if (!querySnapshot.empty) {
          const teacher = querySnapshot.docs[0].data(); // Get the first document's data
          setProfileData(teacher);
        } else {
          console.error("No teacher profiles found.");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Unable to fetch profile data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex  bg-gray-100">
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
              {profileData.teachername}
            </h2>
          </div>

          {/* Right Section */}
          <div className="w-2/3">
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Teacher ID:</p>
              <p className="text-gray-900 font-bold">{profileData.teacherid}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Email:</p>
              <p className="text-gray-900 font-bold">
                {profileData.teacheremail}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Phone:</p>
              <p className="text-gray-900 font-bold">
                {profileData.phonenumber}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Role:</p>
              <p className="text-gray-900 font-bold">{profileData.role}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Department:</p>
              <p className="text-gray-900 font-bold">
                {profileData.department}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-medium">Divisions:</p>
              <p className="text-gray-900 font-bold">
                {profileData.divisions && profileData.divisions.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Subjects:</p>
              <p className="text-gray-900 font-bold">
                {profileData.subjects && profileData.subjects.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        userId={profileData.teacherid} // Or any other identifier for changing the password
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TeacherViewProfile;
