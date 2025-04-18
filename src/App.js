import React, { useState, useEffect, Suspense } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { AuthProvider } from "./authContext";
import Community from "./app/Pages/Community";
import ProtectedCommunity from "./app/routes/ProtectedCommunity";

// Lazy-loaded components
const Dashboard = React.lazy(() => import("./app/Pages/Dashboard"));
const Signuppage = React.lazy(() => import("./app/Pages/Signuppage"));
const StudentDashboard = React.lazy(() =>
  import("./app/Pages/StudentDashboard")
);
const CreatesAccount = React.lazy(() => import("./app/Pages/CreatesAccount"));
const Admin = React.lazy(() => import("./app/Pages/Admin"));
const AddTeacher = React.lazy(() => import("./app/Pages/AddTeacher"));
const AddStudents = React.lazy(() => import("./app/Pages/AddStudent"));
const AddSubjects = React.lazy(() => import("./app/Pages/AddSubjects"));
const TeacherViewProfile = React.lazy(() =>
  import("./app/Components/TeacherViewProfile")
);
const StudentViewProfile = React.lazy(() =>
  import("./app/Components/StudentViewProfile")
);
const AssignmentMarks = React.lazy(() =>
  import("./app/Components/AssignmentMarks")
);
const Courses = React.lazy(() => import("./app/Pages/Courses"));
const Syllabustracker = React.lazy(() =>
  import("./app/Components/Syllabustracker")
);
const Syllabus = React.lazy(() => import("./app/Pages/Syllabus"));
const AddSyllabus = React.lazy(() => import("./app/Pages/AddSyllabus"));
const AddDayTimetable = React.lazy(() => import("./app/Pages/AddDayTimetable"));
const CreateNotice = React.lazy(() => import("./app/Pages/createNotice"));
const Students = React.lazy(() => import("./app/Pages/Students"));
const ListStudents = React.lazy(() => import("./app/Pages/ListStudents"));
const EditTimetable = React.lazy(() => import("./app/Pages/EditTimetable"));
const Notices = React.lazy(() => import("./app/Pages/Notices"));
const Attendance = React.lazy(() => import("./app/Pages/Attendance"));
const Teachers = React.lazy(() => import("./app/Pages/Teachers"));
const Notes = React.lazy(() => import("./app/Pages/Notes"));
const SubjectDetails = React.lazy(() =>
  import("./app/Components/SubjectDetails")
);
const AddAssignment = React.lazy(() => import("./app/Pages/AddAssignment"));
const Assignments = React.lazy(() => import("./app/Pages/Assignments"));
const MarkAttendance = React.lazy(() => import("./app/Pages/MarkAttendance"));
const SeeAttendance = React.lazy(() => import("./app/Pages/SeeAttendance"));
const EditAttendance = React.lazy(() => import("./app/Pages/EditAttendance"));
const AddNotes = React.lazy(() => import("./app/Pages/AddNotes"));
const AdminStudents = React.lazy(() => import("./app/Pages/AdminStudents"));
const AdminTeachers = React.lazy(() => import("./app/Pages/AdminTeachers"));
const Class = React.lazy(() => import("./app/Pages/Class"));
const StudentNotice = React.lazy(() => import("./app/Pages/StudentNotice"));
const AttendanceAnalytics = React.lazy(() =>
  import("./app/Pages/AttendanceAnalytics")
);
const StudentTimetable = React.lazy(() =>
  import("./app/Pages/StudentTimetable")
);
const StudentAttendance = React.lazy(() =>
  import("./app/Pages/StudentAttedence")
);
const StudentNotes = React.lazy(() => import("./app/Pages/StudentNotes"));
const StudentAssignments = React.lazy(() =>
  import("./app/Pages/StudentAssigenment")
);

// Teacher Routes Configuration
const teacherRoutes = [
  { path: "/dashboard", component: Dashboard },
  { path: "/courses", component: Courses },
  { path: "/syllabus", component: Syllabus }, // Updated to use corrected Syllabus
  { path: "/addsyllabus", component: AddSyllabus },
  { path: "/AddDayTimetable", component: AddDayTimetable },
  { path: "/create-notice", component: CreateNotice },
  { path: "/students", component: Students },
  { path: "/liststudents", component: ListStudents },
  { path: "/edittimetable", component: EditTimetable },
  { path: "/Notices", component: Notices },
  { path: "/Attendance", component: Attendance },
  { path: "/Teachers", component: Teachers },
  { path: "/Notes", component: Notes },
  { path: "/subject/:subjectName", component: SubjectDetails },
  { path: "/add-assignment", component: AddAssignment },
  { path: "/assignment", component: Assignments },
  { path: "/mark-attendance", component: MarkAttendance },
  { path: "/see-attendance", component: SeeAttendance },
  { path: "/edit-attendance", component: EditAttendance },
  { path: "/add-notes", component: AddNotes },
  { path: "/AssignmentMarks/:assignmentId", component: AssignmentMarks },
  { path: "/syllabustracker/:subject", component: Syllabustracker },
  { path: "/AttendanceAnalytics", component: AttendanceAnalytics },
];

// Student Routes Configuration
const studentRoutes = [
  { path: "/student-dashboard", component: StudentDashboard },
  { path: "/student-notice", component: StudentNotice },
  { path: "/student-timetable", component: StudentTimetable },
  { path: "/StudentAttendance", component: StudentAttendance },
  { path: "/StudentNotes", component: StudentNotes },
  { path: "/StudentAssignments", component: StudentAssignments },
];

// Admin Routes Configuration
const adminRoutes = [
  { path: "/admin", component: Admin },
  { path: "/adminstudents", component: AdminStudents },
  { path: "/adminteachers", component: AdminTeachers },
  { path: "/add-teacher", component: AddTeacher },
  { path: "/add-students", component: AddStudents },
  { path: "/add-subjects", component: AddSubjects },
  { path: "/create-account", component: CreatesAccount },
  { path: "/edit-timetable", component: EditTimetable },
  { path: "/Addclasses", component: Class },
];

// Universal Routes (accessible by all authenticated users)
const universalRoutes = [
  { path: "/view-profile/:studentId?", component: StudentViewProfile },
  { path: "/teacher/:teacherId", component: TeacherViewProfile },
  { path: "/community", component: Community },
];

const ProtectedRoute = ({ children, roleRequired }) => {
  const [authState, setAuthState] = useState({
    user: null,
    role: null,
    loading: true,
    error: null,
  });
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setAuthState({ user: null, role: null, loading: false, error: null });
          return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.warn("User document not found for UID:", currentUser.uid);
          setAuthState({
            user: currentUser,
            role: null,
            loading: false,
            error:
              "User document not found. Please ensure your account is registered with a role.",
          });
          return;
        }

        const role = userDoc.data().role;
        const normalizedRole = role ? role.toLowerCase() : null;
        setAuthState({
          user: currentUser,
          role: normalizedRole,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthState({
          user: currentUser,
          role: null,
          loading: false,
          error: error.message,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authState.user) {
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  if (roleRequired && authState.role !== roleRequired.toLowerCase()) {
    const redirectPath =
      authState.role === "teacher"
        ? "/dashboard"
        : authState.role === "student"
        ? "/student-dashboard"
        : authState.role === "admin"
        ? "/admin"
        : "/signup";
    return <Navigate to={redirectPath} replace />;
  }

  if (authState.error) {
    return (
      <div className="p-4 text-red-700 bg-red-100 rounded">
        Error: {authState.error}
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Routes>
            <Route path="/signup" element={<Signuppage onLogin={() => {}} />} />
            <Route path="/create-account" element={<CreatesAccount />} />

            {teacherRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute roleRequired="teacher">
                    <Component />
                  </ProtectedRoute>
                }
              />
            ))}

            {studentRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute roleRequired="student">
                    <Component />
                  </ProtectedRoute>
                }
              />
            ))}

            {adminRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute roleRequired="admin">
                    <Component />
                  </ProtectedRoute>
                }
              />
            ))}

            {universalRoutes.map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute>
                    <Component />
                  </ProtectedRoute>
                }
              />
            ))}

            <Route path="*" element={<Navigate to="/signup" replace />} />
            <Route path="/community" element={<ProtectedCommunity />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
