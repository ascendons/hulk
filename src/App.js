import React, { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./app/Pages/Dashboard"; // Import Dashboard component
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
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state

  return (
    <BrowserRouter>
      <Routes>
        {/* Signup Page */}
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
        <Route path="Teachers" element={<Teachers />} />
        <Route path="Addsubjects" element={<AddSubjects />} />
        <Route path="Notes" element={<Notes />} />
        <Route path="/subject/:subjectName" element={<SubjectDetails />} />
        <Route path="/add-notes" element={<AddNotes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
