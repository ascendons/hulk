import React, { useState, useEffect } from "react";
import { db } from "../../config"; // Adjust the path to your firebase.js file
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore"; // Ensure doc is imported correctly
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants"; // Adjust the path to your Constants.js file
import Select from "react-select"; // Ensure this is at the top level

const Class = () => {
  const [department, setDepartment] = useState(DEPARTMENTS[0]); // Default to first department
  const [year, setYear] = useState(Object.values(YEARS)[0]); // Default to first year
  const [className, setClassName] = useState(""); // User-editable class name
  const [classTeacher, setClassTeacher] = useState(""); // Selected teacher ID for class teacher
  const [teachersList, setTeachersList] = useState([]); // List of all teachers from Firestore
  const [studentsList, setStudentsList] = useState([]); // List of filtered students from Firestore
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [students, setStudents] = useState([]); // List of added students
  const [selectedTeachers, setSelectedTeachers] = useState([]); // Selected teachers for react-select
  const [teachers, setTeachers] = useState([]); // List of added teachers
  const [selectedStudents, setSelectedStudents] = useState([]); // Selected students for react-select
  const [subjectName, setSubjectName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(""); // To display errors in the UI
  const [infoMessage, setInfoMessage] = useState(""); // To display informational messages

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "teacher")
        );
        const querySnapshot = await getDocs(q);
        const teachersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
        }));
        console.log("Fetched teachers:", teachersData);
        setTeachersList(teachersData);
        if (teachersData.length > 0) setClassTeacher(teachersData[0].id);
      } catch (error) {
        console.error("Error fetching teachers: ", error);
        setError("Failed to fetch teachers: " + error.message);
      }
    };

    const fetchStudents = async () => {
      try {
        console.log("Fetching students for course:", department, "year:", year);

        // Debug: Verify that doc is a function
        console.log("Is doc a function?", typeof doc === "function");

        // Query students based on course and year
        const q = query(
          collection(db, "students"),
          where("course", "==", department),
          where("year", "==", year)
        );
        const querySnapshot = await getDocs(q);

        // Log the raw data from the students collection
        const rawStudents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Raw students data:", rawStudents);

        if (querySnapshot.empty) {
          console.warn("No students found for the given course and year.");
          setStudentsList([]);
          setInfoMessage(
            `No students found for ${department} in ${year}. Please check the data or select a different course/year.`
          );
          return;
        }

        setInfoMessage(""); // Clear any previous info message

        const studentPromises = querySnapshot.docs.map(async (docItem) => {
          const data = docItem.data();
          // Log the userId being queried
          console.log("Fetching user data for userId:", data.userId);

          // Fetch user details from "users" collection using userId
          const userDocRef = doc(db, "users", data.userId); // Use doc to create a document reference
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data for userId", data.userId, ":", userData);
            return {
              id: data.userId, // Use userId as the unique identifier
              name: userData.name || "Unknown Name",
              email: userData.email || "Unknown Email",
            };
          } else {
            console.warn("No user data found for userId:", data.userId);
            return null; // Skip if user data is not found
          }
        });

        const studentsData = (await Promise.all(studentPromises)).filter(
          (student) => student !== null
        ); // Resolve all promises and filter out null entries
        console.log("Processed students data:", studentsData);
        setStudentsList(studentsData);
      } catch (error) {
        console.error("Error fetching students: ", error);
        setError("Failed to fetch students: " + error.message);
      }
    };

    fetchTeachers();
    fetchStudents();
  }, [department, year]); // Re-run effect when department or year changes

  const teacherOptions = teachersList.map((teacher) => ({
    value: teacher.id,
    label: `${teacher.name} (${teacher.email})`,
  }));

  const studentOptions = studentsList.map((student) => ({
    value: student.id,
    label: `${student.name} (${student.email})`,
  }));

  const addStudent = () => {
    if (studentId && studentName) {
      setStudents([
        ...students,
        { student_id: studentId, student_name: studentName },
      ]);
      setStudentId("");
      setStudentName("");
    }
  };

  const handleTeacherSelection = (selectedOptions) => {
    setSelectedTeachers(selectedOptions || []); // Handle case when all options are deselected
    const newTeachers = (selectedOptions || []).map((option) => {
      const teacher = teachersList.find((t) => t.id === option.value);
      return {
        teacher_id: teacher.id,
        teacher_name: teacher.name,
      };
    });
    setTeachers(newTeachers);
  };

  const handleStudentSelection = (selectedOptions) => {
    setSelectedStudents(selectedOptions || []); // Handle case when all options are deselected
    const newStudents = (selectedOptions || []).map((option) => {
      const student = studentsList.find((s) => s.id === option.value);
      return {
        student_id: student.id,
        student_name: student.name,
      };
    });
    setStudents((prevStudents) => [...prevStudents, ...newStudents]);
  };

  const addSubject = () => {
    if (subjectName) {
      setSubjects([...subjects, { subject_name: subjectName }]);
      setSubjectName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const classRef = doc(db, "classes", department);
      await setDoc(classRef, {
        class_teacher: classTeacher,
      });

      for (const student of students) {
        const studentRef = doc(classRef, "students", student.student_id);
        await setDoc(
          studentRef,
          {
            student_name: student.student_name,
          },
          { merge: true }
        );
      }

      for (const teacher of teachers) {
        const teacherRef = doc(classRef, "teachers", teacher.teacher_id);
        await setDoc(
          teacherRef,
          {
            teacher_name: teacher.teacher_name,
          },
          { merge: true }
        );
      }

      for (const [index, subject] of subjects.entries()) {
        const subjectRef = doc(classRef, "subjects", `sub${index + 1}`);
        await setDoc(subjectRef, {
          subject_name: subject.subject_name,
        });
      }

      alert("Class data added successfully!");
      setClassName("");
      setClassTeacher("");
      setStudents([]);
      setTeachers([]);
      setSubjects([]);
      setSelectedTeachers([]); // Clear selected teachers
      setSelectedStudents([]); // Clear selected students
    } catch (error) {
      console.error("Error adding class data: ", error);
      alert("Error adding class data: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
      >
        Add a New Class
      </h2>
      {error && (
        <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>
      )}
      {infoMessage && (
        <div style={{ color: "orange", marginBottom: "15px" }}>
          {infoMessage}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        {/* Department Selection */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ width: "150px" }}>Department:</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{
              flex: "1",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selection */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ width: "150px" }}>Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{
              flex: "1",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            {Object.values(YEARS).map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Class Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ width: "150px" }}>Class Name:</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g., TYBscITA"
            required
            style={{
              flex: "1",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Class Teacher */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ width: "150px" }}>Class Teacher:</label>
          <select
            value={classTeacher}
            onChange={(e) => setClassTeacher(e.target.value)}
            style={{
              flex: "1",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
          >
            <option value="">Select a Teacher</option>
            {teachersList.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {`${teacher.name} (${teacher.email})`}
              </option>
            ))}
          </select>
        </div>

        {/* Select Students (Dropdown) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ width: "150px" }}>Select Students:</label>
          <div style={{ flex: "1" }}>
            <Select
              isMulti
              options={studentOptions}
              value={selectedStudents}
              onChange={handleStudentSelection}
              placeholder="Select Students"
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  padding: "2px",
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#e0e0e0",
                }),
                multiValueLabel: (provided) => ({
                  ...provided,
                  color: "#333",
                }),
                multiValueRemove: (provided) => ({
                  ...provided,
                  color: "#333",
                  ":hover": {
                    backgroundColor: "#d0d0d0",
                    color: "#000",
                  },
                }),
              }}
            />
          </div>
        </div>

        {/* Select Teachers */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ width: "150px" }}>Select Teachers:</label>
          <div style={{ flex: "1" }}>
            <Select
              isMulti
              options={teacherOptions}
              value={selectedTeachers}
              onChange={handleTeacherSelection}
              placeholder="Select Teachers"
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  padding: "2px",
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#e0e0e0",
                }),
                multiValueLabel: (provided) => ({
                  ...provided,
                  color: "#333",
                }),
                multiValueRemove: (provided) => ({
                  ...provided,
                  color: "#333",
                  ":hover": {
                    backgroundColor: "#d0d0d0",
                    color: "#000",
                  },
                }),
              }}
            />
          </div>
        </div>

        {/* Add Subjects */}
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Add Subjects
          </h3>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Subject Name"
              style={{
                flex: "1",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              type="button"
              onClick={addSubject}
              style={{
                padding: "8px 15px",
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Add Subject
            </button>
          </div>
          <ul style={{ listStyle: "none", padding: "0" }}>
            {subjects.map((subject, index) => (
              <li key={index} style={{ margin: "5px 0" }}>
                {subject.subject_name}
              </li>
            ))}
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            alignSelf: "flex-start",
            width: "200px",
          }}
        >
          Submit Class Data
        </button>
      </form>
    </div>
  );
};

export default Class;
