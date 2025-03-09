import React, { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../config"; // Ensure auth is imported
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/solid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants";

const AddSyllabus = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state with values from location.state or default to empty strings
  const [currentDate, setCurrentDate] = useState("");
  const [department, setDepartment] = useState(
    location.state?.department || ""
  );
  const [year, setYear] = useState(location.state?.year || "");
  const [division, setDivision] = useState(location.state?.division || "");
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState(location.state?.subject || "");
  const [unit, setUnit] = useState("");
  const [topic, setTopic] = useState("");
  const [progress, setProgress] = useState("");
  const [remark, setRemark] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine if fields should be disabled based on whether data is passed
  const isPreFilled =
    !!location.state?.department &&
    !!location.state?.year &&
    !!location.state?.division &&
    !!location.state?.subject;

  const progressOptions = [
    { value: "Not Started", label: "Not Started" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
  ];

  // Set current date on component mount
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setCurrentDate(formattedDate);
  }, []);

  // Filter divisions based on department
  const getFilteredDivisions = () => {
    if (department === "Bsc.IT") {
      return ["A"];
    }
    return DIVISIONS;
  };

  // Fetch subjects based on selected department and pre-select the passed subject
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!department) {
        setSubjects([]);
        return;
      }

      try {
        const subjectsRef = collection(db, "subjects");
        const q = query(subjectsRef, where("department", "==", department));
        const querySnapshot = await getDocs(q);

        const fetchedSubjects = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedSubjects.push(data.subjectName);
        });

        setSubjects(fetchedSubjects);
        // Pre-select the subject from the passed state if it exists in the fetched subjects
        if (
          location.state?.subject &&
          fetchedSubjects.includes(location.state.subject)
        ) {
          setSubject(location.state.subject);
        } else {
          setSubject("");
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setError("Failed to fetch subjects. Please try again.");
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, [department, location.state?.subject]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !department ||
      !year ||
      !division ||
      !subject ||
      !unit ||
      !topic ||
      !progress
    ) {
      toast.error("Please fill all required fields!", {
        style: { backgroundColor: "#FF6B6B" },
      });
      return;
    }

    setIsLoading(true);

    // Get the current authenticated user's ID
    const user = auth.currentUser;
    if (!user) {
      toast.error("No authenticated user found. Please log in.", {
        style: { backgroundColor: "#FF6B6B" },
      });
      setIsLoading(false);
      return;
    }
    const userId = user.uid;

    try {
      const syllabusData = {
        currentDate,
        department,
        year,
        division,
        subject,
        unit,
        topic,
        progress,
        remark,
        createdAt: new Date().toISOString(),
        userId, // Store the userId of the logged-in user
      };

      await addDoc(collection(db, "syllabus"), syllabusData);
      toast.success("Syllabus added successfully!", {
        style: { backgroundColor: "#10B981", color: "#FFFFFF" },
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard"); // Adjust to your dashboard route if different
      }, 1000);

      // Reset form fields
      setDepartment("");
      setYear("");
      setDivision("");
      setSubject("");
      setUnit("");
      setTopic("");
      setProgress("");
      setRemark("");
    } catch (error) {
      console.error("Error adding syllabus:", error);
      toast.error(`Firebase: Error (${error.code}).`, {
        style: { backgroundColor: "#FF6B6B" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/mark-attendance");
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 min-h-screen">
      <button
        onClick={handleBack}
        className="mb-3 p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 self-start"
      >
        <ArrowLeftIcon className="h-4 w-4 text-gray-600" />
      </button>

      <div className="w-full max-w-4xl">
        <h1 className="text-5xl font-bold text-green-500 mb-6 text-center">
          ADD SYLLABUS
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-xl p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Date */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Current Date
              </label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>
            {/* Department */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isPreFilled}
              >
                <option value="" disabled>
                  Select Department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            {/* Year */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isPreFilled}
              >
                <option value="" disabled>
                  Select Year
                </option>
                {Object.values(YEARS).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            {/* Division */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isPreFilled}
              >
                <option value="" disabled>
                  Select Division
                </option>
                {getFilteredDivisions().map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
            {/* Subject */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isPreFilled}
              >
                <option value="" disabled>
                  Select Subject
                </option>
                {subjects.map((subjectName) => (
                  <option key={subjectName} value={subjectName}>
                    {subjectName}
                  </option>
                ))}
              </select>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            {/* Unit */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Enter Unit (e.g., Unit 1)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* Topic */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter Topic"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* Progress */}
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Progress
              </label>
              <select
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>
                  Select Progress
                </option>
                {progressOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Remark */}
            <div className="mb-4 md:col-span-2">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Remark
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter Remark (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-6 px-4 py-2 text-base text-white rounded-md font-medium ${
              isLoading ? "bg-gray-400" : "bg-green-500 hover:bg-green-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {isLoading ? "Saving..." : "Add Syllabus"}
          </button>
        </form>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2000} // Match redirect delay
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

export default AddSyllabus;
