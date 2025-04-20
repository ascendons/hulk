import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../config";
import { useNavigate, Link } from "react-router-dom";
import { renderSkeleton } from "../Components/reactSkelton";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import ReactMarkdown from "react-markdown";

const CLOUD_NAME = "dwdejk1u3";
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
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [timers, setTimers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name || name === "N/A") return "N/A";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

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

  const randomColor =
    backgroundColors[Math.floor(Math.random() * backgroundColors.length)];

  const getPublicIdFromUrl = (url) => {
    if (!url) return "";
    const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const match = url.match(regex);
    return match ? match[1] : url;
  };

  const parseDateFromCompositeId = (compositeId) => {
    const datePart = compositeId.split("_")[3];
    if (datePart && datePart.length === 8) {
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      return `${day}-${month}-${year}`;
    }
    return "Invalid Date";
  };

  const calculateTimer = (createdAt, duration) => {
    if (!createdAt) return "N/A";
    const created = createdAt.toDate();
    const durationMs = duration * 60 * 60 * 1000;
    const endTime = new Date(created.getTime() + durationMs);
    const now = new Date();
    const timeDiff = endTime - now;

    if (timeDiff <= 0) return "Event ended";

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
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

        console.log("Authenticated user:", user.uid);

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

        const teacherQuery = query(
          collection(db, "teachersinfo"),
          where("userId", "==", user.uid)
        );
        const teacherSnapshot = await getDocs(teacherQuery);

        let department = "Department";
        let profilePhotoUrl = "";
        if (!teacherSnapshot.empty) {
          const teacherData = teacherSnapshot.docs[0].data();
          console.log("Teacher data from 'teachersinfo':", teacherData);
          department = teacherData.department || "Department";
          profilePhotoUrl = teacherData.profilePhotoUrl || "";
        } else {
          console.warn("No teacher info found for UID:", user.uid);
        }

        setTeacherInfo({
          name: name,
          email: user.email,
          department: department,
          role: role,
          profilePhotoUrl: profilePhotoUrl,
          userId: user.uid,
        });

        const teachersQuery = query(
          collection(db, "users"),
          where("role", "==", "teacher")
        );
        const teachersSnapshot = await getDocs(teachersQuery);
        setTotalTeachers(teachersSnapshot.size);

        if (name) {
          const subjectsQuery = query(
            collection(db, "subjects"),
            where("teacherName", "==", name)
          );
          const subjectsSnapshot = await getDocs(subjectsQuery);
          setTotalSubjects(subjectsSnapshot.size);
        } else {
          console.warn("Teacher name not found, cannot fetch subjects.");
          setTotalSubjects(0);
        }

        let totalClassStudents = 0;
        if (name) {
          const departmentsSnapshot = await getDocs(collection(db, "classes"));
          for (const deptDoc of departmentsSnapshot.docs) {
            const deptId = deptDoc.id;
            const teachersQuery = query(
              collection(db, "classes", deptId, "teachers")
            );
            const teachersSnapshot = await getDocs(teachersQuery);

            let teacherFound = false;
            for (const teacherDoc of teachersSnapshot.docs) {
              const teacherData = teacherDoc.data();
              if (teacherData["teacher_name"] === name) {
                teacherFound = true;
                break;
              }
            }

            if (teacherFound) {
              const studentsSubcollection = collection(
                db,
                "classes",
                deptId,
                "students"
              );
              const studentsSnapshot = await getDocs(studentsSubcollection);
              totalClassStudents += studentsSnapshot.size;
            }
          }
        } else {
          console.warn("Teacher name not found, cannot fetch students.");
        }
        setTotalStudents(totalClassStudents);
      } catch (error) {
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

    const fetchUpcomingEvents = async () => {
      try {
        console.log("Fetching upcoming events from daytimetable...");
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const unsubscribe = onSnapshot(
          collection(db, "daytimetable"),
          (timetableSnapshot) => {
            const fetchedEvents = [];
            timetableSnapshot.forEach((doc) => {
              const data = doc.data();
              const compositeId = doc.id;
              const dateStr = compositeId.split("_")[3];

              if (dateStr && dateStr.length === 8) {
                const year = parseInt(dateStr.substring(0, 4));
                const month = parseInt(dateStr.substring(4, 6)) - 1;
                const day = parseInt(dateStr.substring(6, 8));
                const eventDate = new Date(year, month, day);
                eventDate.setHours(0, 0, 0, 0);

                if (data.lectures && Array.isArray(data.lectures)) {
                  data.lectures.forEach((lecture, index) => {
                    fetchedEvents.push({
                      id: `${doc.id}_${index}`,
                      date: eventDate,
                      formattedDate: parseDateFromCompositeId(compositeId),
                      description:
                        data.description || "No description available",
                      department: data.department || "Unknown Department",
                      division: data.division || "Unknown Division",
                      startTime: lecture.startTime || "07:00",
                      endTime: lecture.endTime || "08:00",
                      location: lecture.location || "LC",
                      subject: lecture.subject || "Unknown Subject",
                      duration: data.duration || 24,
                      createdAt: data.createdAt,
                    });
                  });
                }
              } else {
                console.log(
                  "Invalid date format for compositeId:",
                  compositeId
                );
              }
            });

            const filteredEvents = fetchedEvents
              .filter((event) => event && event.date >= currentDate)
              .sort((a, b) => a.date - b.date);

            console.log("Filtered and sorted upcoming events:", filteredEvents);
            setUpcomingEvents(filteredEvents);
          },
          (error) => {
            console.error("Error listening to upcoming events:", error);
            setError("Failed to fetch upcoming events: " + error.message);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setError("Failed to fetch upcoming events: " + error.message);
      }
    };

    fetchDashboardData();
    fetchNotices();
    fetchUpcomingEvents();
  }, []);

  useEffect(() => {
    const intervals = upcomingEvents.map((event) => {
      return setInterval(() => {
        const remainingTime = calculateTimer(event.createdAt, event.duration);
        setTimers((prev) => ({
          ...prev,
          [event.id]: remainingTime,
        }));
      }, 1000);
    });

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, [upcomingEvents]);

  if (loading) {
    return renderSkeleton();
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <p className="text-red-500 text-lg font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Fixed Sidebar */}
      <div className="fixed w-64 bg-blue-800 text-white h-screen overflow-y-auto">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6 ml-64">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-green-500 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Welcome back, {teacherInfo.name || "Teacher"}!
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-green-200">
              {teacherInfo.profilePhotoUrl ? (
                <AdvancedImage
                  cldImg={cld
                    .image(getPublicIdFromUrl(teacherInfo.profilePhotoUrl))
                    .resize(fill().width(64).height(64).gravity(autoGravity()))
                    .format("auto")
                    .quality("auto")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/64";
                  }}
                />
              ) : (
                <div
                  className={`w-full h-full ${randomColor} flex items-center justify-center text-white text-2xl font-semibold`}
                >
                  {getInitials(teacherInfo.name)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {teacherInfo.name || "Teacher Name"}
              </h2>
              <p className="text-gray-600 text-sm">
                Department: {teacherInfo.department || "Department"}
              </p>
              <p className="text-gray-600 text-sm">
                Role: {teacherInfo.role || "Teacher"}
              </p>
            </div>
          </div>
          <Link to={`/teacher/${teacherInfo.userId}`}>
            <button className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors text-sm font-medium">
              View Profile
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              {totalStudents}
            </h2>
            <p className="text-gray-600 mt-2">Total Students</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              {totalTeachers}
            </h2>
            <p className="text-gray-600 mt-2">Total Teachers</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              {totalSubjects}
            </h2>
            <p className="text-gray-600 mt-2">Total Subjects</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h2 className="text-3xl font-bold text-orange-600">
              {attendance}%
            </h2>
            <p className="text-gray-600 mt-2">Attendance</p>
          </div>
        </div>

        {/* Button Group */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
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
          <button
            onClick={() => navigate("/syllabus")}
            className="bg-yellow-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
          >
            Syllabus
          </button>
        </div>

        {/* Notice Board and Upcoming Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Notice Board
            </h2>
            {notices.length > 0 ? (
              <ul className="space-y-4">
                {notices.map((notice) => (
                  <li key={notice.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      By: {notice.noticeBy}
                    </p>
                    <p className="text-gray-800">{notice.content}</p>
                    {notice.files && notice.files.length > 0 && (
                      <div className="mt-2">
                        {notice.files.map((file, index) => (
                          <a
                            key={index}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline block"
                          >
                            View Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No notices available.</p>
            )}
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Upcoming Events
            </h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white shadow-sm rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-600 font-medium">
                        Date: {event.formattedDate}
                      </p>
                      <p className="text-gray-600 font-medium">
                        Timer: {timers[event.id] || "Calculating..."}
                      </p>
                    </div>
                    <p className="text-gray-600 font-medium">
                      Time: {event.startTime} - {event.endTime}
                    </p>
                    <p className="text-gray-600 font-medium">
                      Location: {event.location}
                    </p>
                    <p className="text-gray-600 font-medium">
                      Subject: {event.subject}
                    </p>
                    <div className="mt-2">
                      <div className="bg-blue-50 text-gray-800 p-3 rounded-lg">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => (
                              <p className="text-gray-800 mb-2" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc pl-5 mb-2" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="text-gray-800" {...props} />
                            ),
                            strong: ({ node, ...props }) => (
                              <strong
                                className="font-bold text-gray-900"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {event.description === "No description available"
                            ? ""
                            : `**Notice to Students**  \n${event.description}`}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No upcoming events available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
