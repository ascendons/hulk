import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../config";
import { useNavigate, Link } from "react-router-dom";
import { renderSkeleton } from "../Components/reactSkelton";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

// Initialize Cloudinary
const CLOUD_NAME = "dwdejk1u3"; // Use process.env.REACT_APP_CLOUDINARY_CLOUD_NAME in production
const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUD_NAME,
  },
});

const Dashboard = () => {
  const [teacherInfo, setTeacherInfo] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [attendance] = useState(75);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to extract public ID from a full Cloudinary URL
  const getPublicIdFromUrl = (url) => {
    if (!url) return "";
    const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const match = url.match(regex);
    return match ? match[1] : url; // Returns public ID (e.g., "teacher_profiles/ii4okko57kgijjydthjq")
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No authenticated user found!");
          setError("No authenticated user found.");
          return;
        }

        console.log("Authenticated user:", user);

        // Fetch user data from 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.warn(
            "No user data found in 'users' collection for UID:",
            user.uid
          );
          setError("User data not found in Firestore.");
          return;
        }

        const userData = userDoc.data();
        console.log("User data from 'users':", userData);

        const name = userData.name || "Teacher Name";
        const role = userData.role || "Teacher";

        // Fetch teacher data from 'teachersinfo' collection
        const teacherQuery = query(
          collection(db, "teachersinfo"),
          where("userId", "==", user.uid)
        );
        const teacherSnapshot = await getDocs(teacherQuery);

        let department = "Department";
        let profilePhotoUrl = ""; // Initialize profile photo URL
        if (!teacherSnapshot.empty) {
          const teacherData = teacherSnapshot.docs[0].data();
          console.log("Teacher data from 'teachersinfo':", teacherData);
          department = teacherData.department || "Department";
          profilePhotoUrl = teacherData.profilePhotoUrl || ""; // Fetch profile photo URL
        } else {
          console.warn("No teacher info found for UID:", user.uid);
        }

        // Set teacher info including profile photo
        setTeacherInfo({
          name: name,
          email: user.email,
          department: department,
          role: role,
          profilePhotoUrl: profilePhotoUrl, // Add profile photo to state
          userId: user.uid, // Add userId to teacherInfo for navigation
        });

        // Fetch total students
        const studentsQuery = query(
          collection(db, "users"),
          where("role", "==", "student")
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        setTotalStudents(studentsSnapshot.size);

        // Fetch total teachers
        const teachersQuery = query(
          collection(db, "users"),
          where("role", "==", "teacher")
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        setTotalTeachers(teachersSnapshot.size);

        // Fetch total subjects
        const subjectsSnapshot = await getDocs(collection(db, "subjects"));
        setTotalSubjects(subjectsSnapshot.size);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotices = async () => {
      try {
        const noticesSnapshot = await getDocs(collection(db, "notices"));
        const fetchedNotices = noticesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotices(fetchedNotices);
      } catch (error) {
        console.error("Error fetching notices:", error);
        setError("Failed to fetch notices: " + error.message);
      }
    };

    fetchDashboardData();
    fetchNotices();
  }, []);

  if (loading) {
    return renderSkeleton();
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center">
        <p className="text-red-500 text-lg font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed Sidebar (No Border) */}
      <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        {" "}
        {/* Explicitly remove border and outline */}
        <Sidebar />
      </div>

      {/* Main Content with Margin for Fixed Sidebar */}
      <div className="flex-grow p-8 ml-56 bg-gradient-to-br from-gray-50 to-gray-100">
        {" "}
        {/* Explicitly set main content background */}
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-8 text-green-500">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {teacherInfo.name || "Teacher"}!
          </p>
        </div>
        {/* Profile Section */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-8 flex items-center justify-between border border-gray-200">
          {/* Profile Picture */}
          <div className="w-20 h-20 rounded-full mr-6 border-2 border-blue-300 flex items-center justify-center overflow-hidden">
            {teacherInfo.profilePhotoUrl ? (
              <AdvancedImage
                cldImg={cld
                  .image(getPublicIdFromUrl(teacherInfo.profilePhotoUrl))
                  .resize(fill().width(80).height(80).gravity(autoGravity()))
                  .format("auto")
                  .quality("auto")}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 font-bold text-lg">IMG</span>
            )}
          </div>

          {/* Teacher Info */}
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

          {/* View Profile Button */}
          <Link to={`/view-profile/teacher/${teacherInfo.userId}`}>
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium">
              View Profile
            </button>
          </Link>
        </div>
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-blue-600">
              {totalStudents}
            </h2>
            <p className="text-gray-600 mt-2">Total Students</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-green-600">
              {totalTeachers}
            </h2>
            <p className="text-gray-600 mt-2">Total Teachers</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-red-600">{totalSubjects}</h2>
            <p className="text-gray-600 mt-2">Total Subjects</p>
          </div>
          <div className="bg-white shadow-lg rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
            <h2 className="text-3xl font-bold text-yellow-600">
              {attendance}%
            </h2>
            <p className="text-gray-600 mt-2">Attendance</p>
          </div>
        </div>
        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => navigate("/courses")}
            className="bg-blue-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-600 transition-colors"
          >
            Timetable
          </button>
          <button
            onClick={() => navigate("/Attendance")}
            className="bg-green-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-green-600 transition-colors"
          >
            Attendance
          </button>
          <button
            onClick={() => navigate("/Notes")}
            className="bg-purple-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-purple-600 transition-colors"
          >
            Notes
          </button>
          <button
            onClick={() => navigate("/assignment/:id")}
            className="bg-orange-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-orange-600 transition-colors"
          >
            Assignments
          </button>
        </div>
        {/* Notice Board Section (Scrollable) */}
        <div className="bg-white shadow-lg rounded-lg p-6 max-h-96 overflow-y-auto">
          {" "}
          {/* Fixed height with scrolling */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Notice Board
          </h2>
          {notices.length > 0 ? (
            <ul className="space-y-4">
              {notices.map((notice) => (
                <li key={notice.id} className="border-b pb-4 last:border-b-0">
                  <h3 className="text-lg font-semibold text-blue-600">
                    {notice.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    By: {notice.author}
                  </p>
                  <p className="text-gray-800">{notice.content}</p>
                  {notice.attachment && ( // Fixed typo: adjustment -> attachment
                    <a
                      href={notice.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline block mt-2"
                    >
                      View Attachment
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No notices available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
