import React, { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./app/Pages/Dashboard"; // Ensure this import is correct
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
import SignUp from "./app/Pages/signup";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signup"
          element={<Signuppage onLogin={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/home"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/signup" />}
        />
        <Route path="/courses" element={<Courses />} />
        <Route path="/students" element={<Students />} />
        <Route path="/liststudents" element={<ListStudents />} />
        <Route path="*" element={<Navigate to="/signup" />} />
        <Route path="/edittimetable" element={<EditTimetable />} />
        <Route path="/addstudent" element={<AddStudent />} />
        <Route path="/addteacher" element={<AddTeacher />} />
        <Route path="/Notices" element={<Notices />} />
        <Route path="/create-notice" element={<CreateNotice />} />
        <Route path="Attendance" element={<Attendance />} />
        <Route path="/mark-attendance" element={<MarkAttendance />} />
        <Route path="Teachers" element={<Teachers />} />
        <Route path="Addsubjects" element={<AddSubjects />} />
        <Route path="Notes" element={<Notes />} />
        <Route path="/subject/:subjectName" element={<SubjectDetails />} />
        <Route path="/add-notes" element={<AddNotes />} />
        // <Route path="/assignments" element={<Assignments />} />
        <Route path="/add-assignment" element={<AddAssignment />} />
        <Route path="/assignment/:id" element={<AssignmentDetail />} />
        <Route path="/see-attendance" element={<SeeAttendance />} />
        <Route path="/edit-attendance" element={<EditAttendance />} />
        <Route path="/view-profile" element={<TeacherViewProfile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
