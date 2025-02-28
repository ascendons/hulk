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

const Dashboard = React.lazy(() => import("./app/Pages/Dashboard"));
const Signuppage = React.lazy(() => import("./app/Pages/Signuppage"));
const StudentDashboard = React.lazy(() =>
  import("./app/Pages/StudentDashboard")
);

const teacherRoutes = [
  { path: "/dashboard", component: Dashboard },
  {
    path: "/courses",
    component: React.lazy(() => import("./app/Pages/Courses")),
  },
  {
    path: "/students",
    component: React.lazy(() => import("./app/Pages/Students")),
  },
  {
    path: "/liststudents",
    component: React.lazy(() => import("./app/Pages/ListStudents")),
  },
  {
    path: "/edittimetable",
    component: React.lazy(() => import("./app/Pages/EditTimetable")),
  },
  {
    path: "/addstudent",
    component: React.lazy(() => import("./app/Pages/AddStudent")),
  },
  {
    path: "/addteacher",
    component: React.lazy(() => import("./app/Pages/AddTeacher")),
  },
  {
    path: "/Notices",
    component: React.lazy(() => import("./app/Pages/Notices")),
  },
  {
    path: "/create-notice",
    component: React.lazy(() => import("./app/Pages/createNotice")),
  },
  {
    path: "/Attendance",
    component: React.lazy(() => import("./app/Pages/Attendance")),
  },
  {
    path: "/Teachers",
    component: React.lazy(() => import("./app/Pages/Teachers")),
  },
  {
    path: "/Addsubjects",
    component: React.lazy(() => import("./app/Pages/AddSubjects")),
  },
  { path: "/Notes", component: React.lazy(() => import("./app/Pages/Notes")) },
  {
    path: "/subject/:subjectName",
    component: React.lazy(() => import("./app/Components/SubjectDetails")),
  },
  {
    path: "/add-assignment",
    component: React.lazy(() => import("./app/Pages/AddAssignment")),
  },
  {
    path: "/assignment",
    component: React.lazy(() => import("./app/Pages/Assignments")),
  },
  {
    path: "/mark-attendance",
    component: React.lazy(() => import("./app/Pages/MarkAttendance")),
  },
  {
    path: "/see-attendance",
    component: React.lazy(() => import("./app/Pages/SeeAttendance")),
  },
  {
    path: "/edit-attendance",
    component: React.lazy(() => import("./app/Pages/EditAttendance")),
  },
  {
    path: "/view-profile",
    component: React.lazy(() => import("./app/Components/TeacherViewProfile")),
  },
  {
    path: "/Create-account",
    component: React.lazy(() => import("./app/Pages/CreatesAccount")),
  },
  {
    path: "/add-notes",
    component: React.lazy(() => import("./app/Pages/AddNotes")),
  },
];

// Student Routes Configuration
const studentRoutes = [
  { path: "/student-dashboard", component: StudentDashboard },
  {
    path: "/student-notice",
    component: React.lazy(() => import("./app/Pages/StudentNotice")),
  },
  {
    path: "/student-timetable",
    component: React.lazy(() => import("./app/Pages/StudentTimetable")),
  },
  {
    path: "/StudentAttendance",
    component: React.lazy(() => import("./app/Pages/StudentAttedence")),
  },
  {
    path: "/StudentNotes",
    component: React.lazy(() => import("./app/Pages/StudentNotes")),
  },
  {
    path: "/StudentAssignments",
    component: React.lazy(() => import("./app/Pages/StudentAssigenment")),
  },
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
          throw new Error("User document not found");
        }

        const role = userDoc.data().role;
        setAuthState({
          user: currentUser,
          role,
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

  if (authState.role && roleRequired && authState.role !== roleRequired) {
    const redirectPath =
      authState.role === "teacher" ? "/dashboard" : "/student-dashboard";
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

            <Route path="*" element={<Navigate to="/signup" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
