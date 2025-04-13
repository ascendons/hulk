import React, { useState, useEffect } from "react";
import StudentSidebar from "../Components/StudentSidebar";
import { Link } from "react-router-dom";
import { Calendar, ClipboardList, FileText, Bell } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../config";
import { renderSkeleton } from "../Components/reactSkelton";
import ReactMarkdown from "react-markdown";
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
  try {
    const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const match = url.match(regex);
    return match ? match[1] : "";
  } catch (error) {
    console.warn("Invalid Cloudinary URL:", url);
    return "";
  }
};

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = () => setHasError(true);
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (hasError) {
    return <p className="text-red-600">Something went wrong.</p>;
  }
  return children;
};

const StudentDashboard = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [notices, setNotices] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [timers, setTimers] = useState({});
  const [loading, setLoading] = useState(true);

  const handleMouseEnter = () => setIsSidebarHovered(true);
  const handleMouseLeave = () => setIsSidebarHovered(false);

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
    if (!createdAt || !duration) return "N/A";
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

  const fetchNotesAndAssignmentsCount = async (department, year, division) => {
    try {
      const notesRef = collection(db, "notes");
      const notesQuery = query(
        notesRef,
        where("department", "==", department),
        where("year", "==", year),
        where("division", "==", division)
      );
      const notesSnapshot = await getDocs(notesQuery);
      const notesCount = notesSnapshot.size;

      const assignmentsRef = collection(db, "assignments");
      const assignmentsQuery = query(
        assignmentsRef,
        where("department", "==", department),
        where("year", "==", year),
        where("division", "==", division)
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsCount = assignmentsSnapshot.size;

      return { notesCount, assignmentsCount };
    } catch (error) {
      console.error("Error fetching counts:", error);
      return { notesCount: 0, assignmentsCount: 0 };
    }
  };

  const fetchTotalClasses = async (department, division) => {
    try {
      const timetableRef = collection(db, "daytimetable");
      const timetableQuery = query(
        timetableRef,
        where("department", "==", department),
        where("division", "==", division)
      );
      const snapshot = await getDocs(timetableQuery);
      let totalLectures = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lectures && Array.isArray(data.lectures)) {
          totalLectures += data.lectures.length;
        }
      });
      return totalLectures;
    } catch (error) {
      console.error("Error fetching total classes:", error);
      return 0;
    }
  };

  const fetchNotices = async () => {
    try {
      const noticesRef = collection(db, "notices");
      const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
      const noticesSnapshot = await getDocs(noticesQuery);
      const noticesData = noticesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(noticesData);
    } catch (error) {
      console.error("Error fetching notices:", error);
      setNotices([]);
    }
  };

  const fetchUpcomingEvents = (department, division) => {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const timetableRef = collection(db, "daytimetable");
      const timetableQuery = query(
        timetableRef,
        where("department", "==", department),
        where("division", "==", division)
      );

      const unsubscribe = onSnapshot(
        timetableQuery,
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

              if (
                data.lectures &&
                Array.isArray(data.lectures) &&
                eventDate >= currentDate
              ) {
                data.lectures.forEach((lecture, index) => {
                  fetchedEvents.push({
                    id: `${doc.id}_${index}`,
                    date: eventDate,
                    formattedDate: parseDateFromCompositeId(compositeId),
                    description: data.description || "No description available",
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
            }
          });

          const filteredEvents = fetchedEvents.sort((a, b) => a.date - b.date);
          setUpcomingEvents(filteredEvents);
        },
        (error) => {
          console.error("Error listening to upcoming events:", error);
          setUpcomingEvents([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up upcoming events listener:", error);
      setUpcomingEvents([]);
      return () => {};
    }
  };

  const fetchAttendance = async (studentName, department, division) => {
    try {
      const attendanceRef = collection(db, "studentAttendance");
      const querySnapshot = await getDocs(attendanceRef);
      let totalPresent = 0;
      let totalSessions = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.attendance && Array.isArray(data.attendance)) {
          const studentRecords = data.attendance.filter(
            (record) =>
              record.name.trim() === studentName.trim() &&
              (!data.department || data.department === department) &&
              (!data.division || data.division === division)
          );
          studentRecords.forEach((record) => {
            totalSessions++;
            if (record.status === "P") totalPresent++;
          });
        }
      });

      return totalSessions > 0
        ? Math.round((totalPresent / totalSessions) * 100)
        : 0;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      return 0;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const studentDocRef = doc(db, "students", user.uid);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
            const data = studentDoc.data();
            const userDocRef = doc(db, "users", data.userId);
            const userDoc = await getDoc(userDocRef);

            let studentInfo = {
              name: "Student Name",
              department: "Bsc.IT",
              course: "Bsc.IT",
              division: "A",
              year: "Third Year",
              rollNo: "Roll No",
              phoneNumber: "Phone Number",
              profilePhotoUrl: "",
            };

            if (userDoc.exists()) {
              const userData = userDoc.data();
              studentInfo = {
                name: userData.name || "Student Name",
                department: data.department || data.course || "Bsc.IT",
                course: data.course || data.department || "Bsc.IT",
                division: data.division || "A",
                year: data.year || "Third Year",
                rollNo: data.rollno || "Roll No",
                phoneNumber: data.phonenumber || "Phone Number",
                profilePhotoUrl: data.profilePhotoUrl || "",
              };
            } else {
              console.warn("No user document found for userId:", data.userId);
            }

            setStudentData(studentInfo);

            const attendancePercent = await fetchAttendance(
              studentInfo.name,
              studentInfo.department,
              studentInfo.division
            );
            setAttendancePercentage(attendancePercent);

            const { notesCount, assignmentsCount } =
              await fetchNotesAndAssignmentsCount(
                studentInfo.department,
                studentInfo.year,
                studentInfo.division
              );
            setTotalNotes(notesCount);
            setTotalAssignments(assignmentsCount);

            const totalClassesCount = await fetchTotalClasses(
              studentInfo.department,
              studentInfo.division
            );
            setTotalClasses(totalClassesCount);

            await fetchNotices();
            const unsubscribeEvents = fetchUpcomingEvents(
              studentInfo.department,
              studentInfo.division
            );

            return () => {
              unsubscribe();
              unsubscribeEvents();
            };
          } else {
            console.error("No student document found for UID:", user.uid);
            setStudentData(null);
            setAttendancePercentage(0);
            setTotalNotes(0);
            setTotalAssignments(0);
            setTotalClasses(0);
            setNotices([]);
            setUpcomingEvents([]);
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
          setStudentData(null);
          setAttendancePercentage(0);
          setTotalNotes(0);
          setTotalAssignments(0);
          setTotalClasses(0);
          setNotices([]);
          setUpcomingEvents([]);
        }
      } else {
        console.log("No user authenticated");
        setStudentData(null);
        setAttendancePercentage(0);
        setTotalNotes(0);
        setTotalAssignments(0);
        setTotalClasses(0);
        setNotices([]);
        setUpcomingEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const intervals = upcomingEvents
      .filter((event) => event.createdAt && event.duration)
      .map((event) => {
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
    <div className="flex min-h-screen bg-gray-50">
      <div
        className={`fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0 transition-all duration-300 ${
          isSidebarHovered ? "shadow-lg" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <StudentSidebar />
      </div>
      <div className="flex-1 p-6 ml-56">
        <h1 className="text-5xl font-bold text-orange-500 mb-6">Dashboard</h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full border-2 border-blue-300 overflow-hidden">
              {studentData.profilePhotoUrl &&
              getPublicIdFromUrl(studentData.profilePhotoUrl) ? (
                <AdvancedImage
                  cldImg={cld
                    .image(getPublicIdFromUrl(studentData.profilePhotoUrl))
                    .resize(fill().width(64).height(64).gravity(autoGravity()))
                    .format("auto")
                    .quality("auto")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-bold text-lg">
                  {studentData.name.charAt(0).toUpperCase()}
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
            <p className="text-3xl font-bold text-blue-600">{totalClasses}</p>
            <p className="text-gray-600">Total Classes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-green-500">
              {attendancePercentage}%
            </p>
            <p className="text-gray-600">Attendance</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-purple-500">{totalNotes}</p>
            <p className="text-gray-600">Total Notes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center border border-gray-200">
            <p className="text-3xl font-bold text-orange-500">
              {totalAssignments}
            </p>
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
            <Bell className="mr-2" size={18} /> Assignment
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ErrorBoundary>
            <div className="bg-white shadow-lg rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Notice Board
              </h2>
              {notices.length > 0 ? (
                <ul className="space-y-4">
                  {notices.map((notice) => (
                    <li
                      key={notice.id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <h3 className="text-lg font-semibold text-blue-600">
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
          </ErrorBoundary>

          <ErrorBoundary>
            <div className="bg-white shadow-lg rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Upcoming Events
              </h2>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
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
                        <div className="bg-blue-100 text-gray-800 p-3 rounded-lg">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="text-gray-800 mb-2" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-5 mb-2"
                                  {...props}
                                />
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
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
