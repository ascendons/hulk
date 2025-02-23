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

const ProtectedRoute = ({ children, roleRequired }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
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
            setUserRole(null); // Handle user not found in Firestore
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setIsLoading(false); // Set loading to false after fetching
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Show loading while checking auth and role
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

        <Route path="/courses" element={<Courses />} />
        <Route path="/students" element={<Students />} />
        <Route path="/liststudents" element={<ListStudents />} />
        <Route path="/edittimetable" element={<EditTimetable />} />
        <Route path="/addstudent" element={<AddStudent />} />
        <Route path="/addteacher" element={<AddTeacher />} />
        <Route path="/Notices" element={<Notices />} />
        <Route path="/create-notice" element={<CreateNotice />} />
        <Route path="/Attendance" element={<Attendance />} />
        <Route path="/mark-attendance" element={<MarkAttendance />} />
        <Route path="/Teachers" element={<Teachers />} />
        <Route path="/Addsubjects" element={<AddSubjects />} />
        <Route path="/Notes" element={<Notes />} />
        <Route path="/subject/:subjectName" element={<SubjectDetails />} />
        <Route path="/add-notes" element={<AddNotes />} />
        <Route path="/add-assignment" element={<AddAssignment />} />
        <Route path="/assignment/:id" element={<AssignmentDetail />} />
        <Route path="/see-attendance" element={<SeeAttendance />} />
        <Route path="/edit-attendance" element={<EditAttendance />} />
        <Route path="/view-profile" element={<TeacherViewProfile />} />
        <Route path="/Create-account" element={<CreateAccount />} />

        <Route path="*" element={<Navigate to="/signup" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
