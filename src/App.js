import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config";
import Dashboard from "./app/Pages/Dashboard";
import Signuppage from "./app/Pages/Signuppage";
import Courses from "./app/Pages/Courses";
import Students from "./app/Pages/Students";
import ListStudents from "./app/Pages/ListStudents";
import EditTimetable from "./app/Pages/EditTimetable";
import AddStudent from "./app/Pages/AddStudent";
import AddTeacher from "./app/Pages/AddTeacher";
import Notices from "./app/Pages/Notices";
import CreateNotice from "./app/Pages/createNotice";
import Attendance from "./app/Pages/Attendance";
import Teachers from "./app/Pages/Teachers";
import AddSubjects from "./app/Pages/AddSubjects";
import Notes from "./app/Pages/Notes";
import SubjectDetails from "./app/Components/SubjectDetails";
import AddNotes from "./app/Pages/AddNotes";
import Assignments from "./app/Pages/Assignments";
import AddAssignment from "./app/Pages/AddAssignment";
import AssignmentDetail from "./app/Components/AssignmentDetail";
import MarkAttendance from "./app/Pages/MarkAttendance";
import SeeAttendance from "./app/Pages/SeeAttendance";
import EditAttendance from "./app/Pages/EditAttendance";
import TeacherViewProfile from "./app/Components/TeacherViewProfile";
import CreateAccount from "./app/Pages/CreatesAccount";
import StudentDashboard from "./app/Pages/StudentDashboard";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./config";
import { AuthProvider } from "./authContext"; // Import AuthProvider
import StudentNotice from "./app/Pages/StudentNotice";
import StudentAttendance from "./app/Pages/StudentAttedence";
import StudentTimetable from "./app/Pages/StudentTimetable";
import StudentNotes from "./app/Pages/StudentNotes";

const ProtectedRoute = ({ children, roleRequired }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed, currentUser:", currentUser);
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            console.log("User role from Firestore:", userDoc.data().role);
            setUserRole(userDoc.data().role);
          } else {
            console.error("User document not found for UID:", currentUser.uid);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("User not authenticated, redirecting to /signup");
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  if (userRole && roleRequired && userRole !== roleRequired) {
    console.log(
      "Role mismatch, userRole:",
      userRole,
      "required:",
      roleRequired
    );
    if (userRole === "teacher") {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === "student") {
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  console.log("Access granted to route, userRole:", userRole);
  return children;
};

function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap with AuthProvider */}
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signuppage onLogin={() => {}} />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute roleRequired="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/liststudents"
            element={
              <ProtectedRoute roleRequired="teacher">
                <ListStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edittimetable"
            element={
              <ProtectedRoute roleRequired="teacher">
                <EditTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addstudent"
            element={
              <ProtectedRoute roleRequired="teacher">
                <AddStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addteacher"
            element={
              <ProtectedRoute roleRequired="teacher">
                <AddTeacher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Notices"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Notices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-notice"
            element={
              <ProtectedRoute roleRequired="teacher">
                <CreateNotice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Attendance"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mark-attendance"
            element={
              <ProtectedRoute roleRequired="teacher">
                <MarkAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Teachers"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Addsubjects"
            element={
              <ProtectedRoute roleRequired="teacher">
                <AddSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Notes"
            element={
              <ProtectedRoute roleRequired="teacher">
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subject/:subjectName"
            element={
              <ProtectedRoute roleRequired="teacher">
                <SubjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-notes"
            element={
              <ProtectedRoute roleRequired="teacher">
                <AddNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-assignment"
            element={
              <ProtectedRoute roleRequired="teacher">
                <AddAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignment"
            element={
              <ProtectedRoute roleRequired="teacher">
                <AssignmentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/see-attendance"
            element={
              <ProtectedRoute roleRequired="teacher">
                <SeeAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-attendance"
            element={
              <ProtectedRoute roleRequired="teacher">
                <EditAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-profile"
            element={
              <ProtectedRoute roleRequired="teacher">
                <TeacherViewProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Create-account"
            element={
              <ProtectedRoute roleRequired="teacher">
                <CreateAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-notice"
            element={
              <ProtectedRoute roleRequired="student">
                <StudentNotice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-timetable"
            element={
              <ProtectedRoute roleRequired="student">
                <StudentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/StudentAttendance"
            element={
              <ProtectedRoute roleRequired="student">
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/StudentNotes"
            element={
              <ProtectedRoute roleRequired="student">
                <StudentNotes />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/signup" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
