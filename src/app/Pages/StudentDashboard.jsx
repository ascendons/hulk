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
<<<<<<< HEAD
import ReactMarkdown from "react-markdown"; // Add for Markdown rendering
=======
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
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e

const StudentDashboard = () => {
  const [, setIsSidebarOpen] = useState(false); // Fixed unused state variable
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [notices, setNotices] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [timers, setTimers] = useState({});
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  const handleMouseEnter = () => {
    setIsSidebarHovered(true);
  };

  const handleMouseLeave = () => {
    setIsSidebarHovered(false);
  };

  // Function to parse date from composite ID (e.g., from daytimetable)
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

  // Function to calculate remaining time for events
  const calculateTimer = (createdAt, duration) => {
    if (!createdAt) return "N/A";
    const created = createdAt.toDate();
    const durationMs = duration * 60 * 60 * 1000; // Convert hours to milliseconds
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
      console.log("Querying notes with:", { department, year, division });
      const notesRef = collection(db, "notes");
      const notesQuery = query(
        notesRef,
        where("department", "==", department),
        where("year", "==", year),
        where("division", "==", division)
      );
      const notesSnapshot = await getDocs(notesQuery);
      console.log(
        "All notes data:",
        notesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      const notesCount = notesSnapshot.size;

      console.log("Querying assignments with:", { department, year, division });
      const assignmentsRef = collection(db, "assignments");
      const assignmentsQuery = query(
        assignmentsRef,
        where("department", "==", department),
        where("year", "==", year),
        where("division", "==", division)
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      console.log(
        "All assignments data:",
        assignmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      const assignmentsCount = assignmentsSnapshot.size;

      return { notesCount, assignmentsCount };
    } catch (error) {
      console.error("Error fetching counts:", error);
      return { notesCount: 0, assignmentsCount: 0 };
    }
  };

  const fetchNotices = async () => {
    try {
      const noticesRef = collection(db, "notices");
      const noticesQuery = query(noticesRef, orderBy("createdAt", "desc")); // Order by creation date, newest first
      const noticesSnapshot = await getDocs(noticesQuery);
      const noticesData = noticesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched Notices:", noticesData);
      setNotices(noticesData);
    } catch (error) {
      console.error("Error fetching notices:", error);
      setNotices([]);
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
                  // Filter events based on student's department and division
                  if (
                    data.department === studentData?.department &&
                    data.division === studentData?.division &&
                    eventDate >= currentDate
                  ) {
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
                  }
                });
              }
            } else {
              console.log("Invalid date format for compositeId:", compositeId);
            }
          });

          const filteredEvents = fetchedEvents.sort((a, b) => a.date - b.date);
          console.log("Filtered and sorted upcoming events:", filteredEvents);
          setUpcomingEvents(filteredEvents);
        },
        (error) => {
          console.error("Error listening to upcoming events:", error);
          setUpcomingEvents([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      setUpcomingEvents([]);
    }
  };

=======
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const studentDocRef = doc(db, "students", user.uid);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
<<<<<<< HEAD
            const data = studentDoc.data();
            const userdocRef = doc(db, "users", data.userId);
            const userdoc = await getDoc(userdocRef);

            if (userdoc.exists()) {
              const userData = userdoc.data();
              const studentInfo = {
                name: userData.name || "Student Name",
                department: data.department || data.course || "Bsc.IT",
                course: data.course || data.department || "Bsc.IT",
                division: data.division || "A",
                year: data.year || "Third Year",
                rollNo: data.rollno || "Roll No",
                phoneNumber: data.phonenumber || "Phone Number",
              };
              console.log("Student Info:", studentInfo);
              setStudentData(studentInfo);

              // Fetch attendance data
              const attendanceRef = collection(db, "studentAttendance");
              const querySnapshot = await getDocs(attendanceRef);

              if (querySnapshot.empty) {
                console.log("No attendance records found.");
                setAttendancePercentage(0);
              } else {
                const fetchedRecords = [];
                let totalPresent = 0;
                let totalSessions = 0;

                querySnapshot.forEach((doc) => {
                  const data = doc.data();
                  if (data.attendance) {
                    const studentRecords = data.attendance.filter(
                      (record) => record.name.trim() === userData.name.trim()
                    );
                    fetchedRecords.push(...studentRecords);

                    studentRecords.forEach((record) => {
                      totalSessions++;
                      if (record.status === "P") totalPresent++;
                    });
                  }
                });

                if (fetchedRecords.length > 0) {
                  setAttendancePercentage(
                    totalSessions > 0
                      ? Math.round((totalPresent / totalSessions) * 100)
                      : 0
                  );
                } else {
                  console.log(
                    "No attendance records found for this student:",
                    userData.name
                  );
                  setAttendancePercentage(0);
                }
              }

              // Fetch notes and assignments counts
              console.log("Querying with:", {
                department: studentInfo.department,
                year: studentInfo.year,
                division: studentInfo.division,
              });
              const { notesCount, assignmentsCount } =
                await fetchNotesAndAssignmentsCount(
                  studentInfo.department,
                  studentInfo.year,
                  studentInfo.division
                );
              console.log("Fetched Counts:", { notesCount, assignmentsCount });
              setTotalNotes(notesCount);
              setTotalAssignments(assignmentsCount);

              // Fetch notices and upcoming events
              await fetchNotices();
              await fetchUpcomingEvents();
=======
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
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e
            } else {
              console.error("No user document found for userId:", data.userId);
              setStudentData({
                name: "Student Name",
<<<<<<< HEAD
                department: data.department || "Bsc.IT",
                course: data.course || "Bsc.IT",
                division: "A",
                year: "Third Year",
                rollNo: data.rollno || "Roll No",
                phoneNumber: data.phonenumber || "Phone Number",
              });
              setAttendancePercentage(0);
              setTotalNotes(0);
              setTotalAssignments(0);
              setNotices([]);
              setUpcomingEvents([]);
=======
                department: data.department || "Department",
                course: data.course || "Course",
                division: data.division || "Division",
                year: data.year || "Year",
                rollNo: data.rollno || "Roll No",
                phoneNumber: data.phonenumber || "Phone Number",
                profilePhotoUrl: data.profilePhotoUrl || "",
              });
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e
            }
          } else {
            console.error("No student document found for UID:", user.uid);
            setStudentData({
              name: "Student Name",
<<<<<<< HEAD
              department: "Bsc.IT",
              course: "Bsc.IT",
              division: "A",
              year: "Third Year",
              rollNo: "Roll No",
              phoneNumber: "Phone Number",
=======
              department: "Department",
              course: "Course",
              division: "Division",
              year: "Year",
              rollNo: "Roll No",
              phoneNumber: "Phone Number",
              profilePhotoUrl: "",
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e
            });
            setAttendancePercentage(0);
            setTotalNotes(0);
            setTotalAssignments(0);
            setNotices([]);
            setUpcomingEvents([]);
          }
        } catch (error) {
          console.error("Error fetching student data or counts:", error);
          setStudentData({
            name: "Student Name",
            department: "Bsc.IT",
            course: "Bsc.IT",
            division: "A",
            year: "Third Year",
            rollNo: "Roll No",
            phoneNumber: "Phone Number",
            profilePhotoUrl: "",
          });
          setAttendancePercentage(0);
          setTotalNotes(0);
          setTotalAssignments(0);
          setNotices([]);
          setUpcomingEvents([]);
        }
      } else {
        console.log("No user authenticated");
        setStudentData(null);
        setAttendancePercentage(0);
        setTotalNotes(0);
        setTotalAssignments(0);
        setNotices([]);
        setUpcomingEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Timer for upcoming events
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
<<<<<<< HEAD
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed w-56 bg-blue-800 text-white h-screen overflow-y-hidden border-0 outline-0">
        <StudentSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 ml-56">
        <h1 className="text-5xl font-bold text-orange-500 mb-6">Dashboard</h1>
=======
    <div className="flex min-h-screen bg-gray-100">
      <StudentSidebar />
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e

        {/* Welcome Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between border border-gray-200">
<<<<<<< HEAD
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
              <span className="text-gray-500 font-bold text-lg">IMG</span>
            </div>
            <div>
              <p className="text-gray-800 font-semibold">
                Welcome back, <span className="text-orange-500">Student!</span>
=======
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
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e
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

<<<<<<< HEAD
        {/* Notice Board and Upcoming Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notice Board */}
          <div className="bg-white shadow-lg rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200">
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

          {/* Upcoming Events */}
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
=======
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Notice Board</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">New testing notice</p>
              <p className="text-gray-500 text-sm">By: </p>
              <p className="text-gray-700">Hellownladiskdidad a dakdald</p>
            </div>
>>>>>>> eaa7921233d0d266183d89e80df2faf16e28343e
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;