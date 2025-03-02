import React, { useState, useEffect } from "react";
import { Cloudinary } from "@cloudinary/url-gen"; // For creating CloudinaryImage objects
import { AdvancedImage } from "@cloudinary/react"; // For rendering the image
import { auto } from "@cloudinary/url-gen/actions/resize"; // Transformation: auto resize
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity"; // Transformation: auto gravity
import { db, auth } from "../../config"; // Firebase config
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import Sidebar from "../Components/Sidebar";
import { useNavigate, Link } from "react-router-dom";
import { renderSkeleton } from "../Components/reactSkelton";

// Initialize Cloudinary with your cloud name
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dwdejk1u3", // Replace with your Cloudinary cloud name
  },
});

const Dashboard = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [attendance, setAttendance] = useState(75);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(""); // Full URL from Firestore
  const navigate = useNavigate();

  // Fetch dashboard data including profile photo URL from Firestore
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // Fetch user data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) throw new Error("User data not found.");
        const userData = userDoc.data();

        // Fetch teacher-specific data
        const teacherQuery = query(
          collection(db, "teachersinfo"),
          where("userId", "==", user.uid)
        );
        const teacherSnapshot = await getDocs(teacherQuery);
        let department = "Department";
        let photoUrl = "";
        if (!teacherSnapshot.empty) {
          const teacherData = teacherSnapshot.docs[0].data();
          department = teacherData.department || "Department";
          photoUrl = teacherData.profilePhotoUrl || ""; // Full Cloudinary URL
        }

        setTeacherInfo({
          name: userData.name || "Teacher Name",
          email: user.email,
          department: department,
          role: userData.role || "Teacher",
        });
        setProfilePhotoUrl(photoUrl);

        // Fetch stats (students, teachers, subjects)
        const studentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        setTotalStudents(studentsSnapshot.size);

        const teachersQuery = query(
          collection(db, "users"),
          where("role", "==", "teacher")
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        setTotalTeachers(teachersSnapshot.size);

        const subjectsSnapshot = await getDocs(collection(db, "subjects"));
        setTotalSubjects(subjectsSnapshot.size);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotices = async () => {
      try {
        const noticesSnapshot = await getDocs(collection(db, "notices"));
        setNotices(
          noticesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (err) {
        console.error("Error fetching notices:", err);
        setError(err.message);
      }
    };

    fetchDashboardData();
    fetchNotices();
  }, []);

  // Function to extract public ID from a Cloudinary URL
  const extractPublicId = (url) => {
    if (!url) return "";
    const parts = url.split("/");
    const publicIdWithExtension = parts[parts.length - 1]; // e.g., "ngglzmgduanmvu1xtbfu.jpg"
    return publicIdWithExtension.split(".")[0]; // Remove extension, e.g., "ngglzmgduanmvu1xtbfu"
  };

  // Create the CloudinaryImage object
  const publicId = extractPublicId(profilePhotoUrl);
  const cloudinaryImage = publicId
    ? cld
        .image(publicId)
        .format("auto") // Optimize format
        .quality("auto") // Optimize quality
        .resize(auto().gravity(autoGravity()).width(200).height(200)) // Resize to fit profile circle
    : null;

  // Render loading or error states
  if (loading) return renderSkeleton();
  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center">
        <p className="text-red-500 text-lg font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isSidebarHovered ? "w-64" : "w-16"
        } bg-blue-800 text-white h-screen transition-all duration-300 overflow-hidden`}
      >
        <Sidebar />
      </div>

      <div className="flex-grow p-8">
        <h1 className="text-5xl font-bold mb-8 text-green-500">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {teacherInfo.name || "Teacher"}!
        </p>

        {/* Profile Section */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-8 flex items-center justify-between border border-gray-200">
          <div className="w-20 h-20 rounded-full mr-6 border-2 border-blue-300 overflow-hidden">
            {cloudinaryImage ? (
              <AdvancedImage
                cldImg={cloudinaryImage}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-gray-900">
              {teacherInfo.name || "Teacher Name"}
            </h2>
            <p className="text-gray-600 text-sm">
              Department: {teacherInfo.department || "Department"}
            </p>
            <p className="text-gray-600 text-sm">
              Role: {teacherInfo.role || "Teacher"}
            </p>
          </div>
          <Link to="/view-profile">
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium">
              View Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
