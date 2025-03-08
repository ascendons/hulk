import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../config"; // Adjust path based on your Firebase config
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import ArrowLeftIcon
import { ToastContainer, toast } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import toastify CSS

const AddSubjects = () => {
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [department, setDepartment] = useState("");
  const [teacherId, setTeacherId] = useState(""); // Store teacher userId
  const [teacherName, setTeacherName] = useState(""); // Store teacher name
  const [teachers, setTeachers] = useState([]); // State to store fetched teachers
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const semesterOptions = [
    { value: 1, label: "Semester 1" },
    { value: 2, label: "Semester 2" },
    { value: 3, label: "Semester 3" },
    { value: 4, label: "Semester 4" },
    { value: 5, label: "Semester 5" },
    { value: 6, label: "Semester 6" },
  ];

  const departmentOptions = [
    { value: "Bsc.IT", label: "Bsc.IT" },
    { value: "BCOM", label: "BCOM" },
    { value: "BMS", label: "BMS" },
  ];

  // Fetch teachers from Firestore
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No authenticated user found!");
          setError("No authenticated user found.");
          return;
        }

        // Query teachers from the 'users' collection where role is 'teacher'
        const teachersQuery = query(
          collection(db, "users"),
          where("role", "==", "teacher")
        );
        const teachersSnapshot = await getDocs(teachersQuery);

        const teacherList = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          userId: doc.id, // Use document ID as userId
          name: doc.data().name || `Teacher ${doc.id}`, // Fetch name from Firestore
        }));

        setTeachers(teacherList);
        setError(null);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setError("Failed to fetch teachers. Please try again.");
      }
    };

    fetchTeachers();
  }, []);

  // Fetch teacher name when teacherId changes
  useEffect(() => {
    const fetchTeacherName = async () => {
      if (!teacherId) {
        setTeacherName("");
        return;
      }

      try {
        const teacherDoc = await getDoc(doc(db, "users", teacherId));
        if (teacherDoc.exists()) {
          setTeacherName(teacherDoc.data().name || `Teacher ${teacherId}`);
        } else {
          setTeacherName(`Teacher ${teacherId}`); // Fallback if no name
        }
      } catch (error) {
        console.error("Error fetching teacher name:", error);
        setTeacherName(`Teacher ${teacherId}`);
        setError("Failed to fetch teacher name.");
      }
    };

    fetchTeacherName();
  }, [teacherId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !subjectId ||
      !subjectName ||
      !department ||
      semesters.length === 0 ||
      !teacherId
    ) {
      toast.error("Please fill all the fields!", {
        style: { backgroundColor: "#FF6B6B" }, // Red for error
      });
      return;
    }

    setIsLoading(true);

    try {
      const newSubject = {
        subjectId,
        subjectName,
        department,
        semesters,
        teacherId, // Store the selected teacher userId
        teacherName, // Store the fetched teacher name
      };

      await addDoc(collection(db, "subjects"), newSubject);
      toast.success("Subject added successfully to Firestore!", {
        style: { backgroundColor: "#4A90E2", color: "#FFFFFF" }, // Blue background with white text
      });

      // Reset form fields
      setSubjectId("");
      setSubjectName("");
      setDepartment("");
      setSemesters([]);
      setTeacherId("");
      setTeacherName("");
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error(`Firebase: Error (${error.code}).`, {
        style: { backgroundColor: "#FF6B6B" }, // Red for error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSemesterChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSemesters([...semesters, parseInt(value)]);
    } else {
      setSemesters(semesters.filter((sem) => sem !== parseInt(value)));
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/admin");
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-3 p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 self-start"
      >
        <ArrowLeftIcon className="h-4 w-4 text-gray-600" />
      </button>

      <div className="w-full max-w-md">
        <h1 className="text-5xl font-bold text-blue-600 mb-4 text-center">
          ADD SUBJECTS
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-xl p-4"
        >
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Subject ID
            </label>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="Enter Subject ID (e.g., SUB001)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Enter Subject Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Department
              </option>
              {departmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Teacher
              </option>
              {teachers.map((teacherOption) => (
                <option key={teacherOption.id} value={teacherOption.userId}>
                  {teacherOption.name}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            {teacherName && (
              <p className="text-gray-600 text-xs mt-1">
                Selected Teacher: {teacherName}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Semesters
            </label>
            <div className="grid grid-cols-3 gap-2">
              {semesterOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={semesters.includes(option.value)}
                    onChange={handleSemesterChange}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 text-base text-white rounded-md font-medium ${
              isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {isLoading ? "Saving..." : "Add Subject"}
          </button>
        </form>
      </div>

      {/* Add ToastContainer for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default AddSubjects;
