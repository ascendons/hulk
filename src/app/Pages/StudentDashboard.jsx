import React, { useState, useEffect } from "react";
import StudentSidebar from "../Components/StudentSidebar";
import { Link } from "react-router-dom";
import { User, Calendar, ClipboardList, FileText, Bell } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config";
import { renderSkeleton } from "../Components/reactSkelton";
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
  const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/; // Matches /v[version]/public_id(.extension)?
  const match = url.match(regex);
  if (!match) {
    console.warn("Invalid Cloudinary URL, using full URL as fallback:", url);
    return url; // Fallback to full URL if regex fails
  }
  return match[1]; // Returns the public_id (e.g., "teachers_profiles/some-image")
};

const StudentDashboard = () => {
  const [, setIsSidebarOpen] = useState(false); // Fixed unused state variable
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed, user:", user);
      if (user) {
        try {
          const studentDocRef = doc(db, "students", user.uid);
          console.log("Fetching student data for UID:", user.uid);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
            console.log("Student document found:", studentDoc.data());
            const data = studentDoc.data();
            const userDocRef = doc(db, "users", data.userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              setStudentData({
                name: userData.name || "Student Name",
                department: data.department || "Department",
                course: data.course || "Course",
                division: data.division || "Division",
                year: data.year || "Year",
                rollNo: data.rollno || "Roll No",
                phoneNumber: data.phonenumber || "Phone Number",
                profilePhotoUrl: data.profilePhotoUrl || "",
              });
            } else {
              console.error("No user document found for userId:", data.userId);
              setStudentData({
                name: "Student Name",
                department: data.department || "Department",
                course: data.course || "Course",
                division: data.division || "Division",
                year: data.year || "Year",
                rollNo: data.rollno || "Roll No",
                phoneNumber: data.phonenumber || "Phone Number",
                profilePhotoUrl: data.profilePhotoUrl || "",
              });
            }
          } else {
            console.error("No student document found for UID:", user.uid);
            setStudentData({
              name: "Student Name",
              department: "Department",
              course: "Course",
              division: "Division",
              year: "Year",
              rollNo: "Roll No",
              phoneNumber: "Phone Number",
              profilePhotoUrl: "",
            });
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
          setStudentData({
            name: "Student Name",
            department: "Department",
            course: "Course",
            division: "Division",
            year: "Year",
            rollNo: "Roll No",
            phoneNumber: "Phone Number",
            profilePhotoUrl: "",
          });
        }
      } else {
        console.log("No user authenticated");
        setStudentData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return renderSkeleton();
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-xl font-semibold">
          No student data available. Please log in.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <StudentSidebar />

      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">Dashboard</h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full border-2 border-blue-300 overflow-hidden">
              {studentData.profilePhotoUrl ? (
                <AdvancedImage
                  cldImg={cld
                    .image(getPublicIdFromUrl(studentData.profilePhotoUrl))
                    .resize(fill().width(64).height(64).gravity(autoGravity()))
                    .format("auto")
                    .quality("auto")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error loading image:", studentData.profilePhotoUrl);
                    e.target.style.display = "none"; // Hide on error
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-bold text-lg">
                  IMG
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-800 font-semibold">
                Welcome back,{" "}
                <span className="text-orange-500 font-semibold">
                  {studentData.name.split(" ")[0]}!
                </span>
              </p>
              <p className="text-gray-600">Student Name: {studentData.name}</p>
              <p className="text-gray-600">Department: {studentData.course}</p>
              <p className="text-gray-600">Role: Student</p>
            </div>
          </div>
          <Link
            to="/view-profile"
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
          >
            View Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-blue-600">15</p>
            <p className="text-gray-600">Total Classes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-green-500">85%</p>
            <p className="text-gray-600">Attendance</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-purple-500">12</p>
            <p className="text-gray-600">Total Notes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-yellow-500">8</p>
            <p className="text-gray-600">Assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Link
            to="/student-timetable"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <Calendar className="mr-2" size={18} /> Timetable
          </Link>
          <Link
            to="/StudentAttendance"
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-center hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <ClipboardList className="mr-2" size={18} /> Attendance
          </Link>
          <Link
            to="/StudentNotes"
            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-center hover:bg-purple-600 transition-colors flex items-center justify-center"
          >
            <FileText className="mr-2" size={18} /> Notes
          </Link>
          <Link
            to="/StudentAssignments"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-center hover:bg-orange-600 transition-colors flex items-center justify-center"
          >
            <Bell className="mr-2" size={18} /> Assignments
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Notice Board</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">New testing notice</p>
              <p className="text-gray-500 text-sm">By: </p>
              <p className="text-gray-700">Hellownladiskdidad a dakdald</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;