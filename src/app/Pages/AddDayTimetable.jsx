import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../config"; // Import Firestore configuration
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"; // Firestore methods
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants"; // Import constants
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import ArrowLeftIcon

const AddDayTimetable = () => {
  const [lectures, setLectures] = useState([
    { startTime: "", endTime: "", subject: "", location: "" },
  ]); // Initial state with one empty lecture
  const [duration, setDuration] = useState("24"); // Default duration (24 or 48 hours)
  const [selectedDate, setSelectedDate] = useState(""); // Date input
  const [department, setDepartment] = useState(""); // Department input
  const [year, setYear] = useState(""); // Year input
  const [division, setDivision] = useState(""); // Division input
  const [description, setDescription] = useState(""); // Description input
  const [subjects, setSubjects] = useState([]); // State to store fetched subjects
  const [error, setError] = useState(null); // For error handling
  const navigate = useNavigate(); // Hook for navigation

  // Filter divisions based on department
  const getFilteredDivisions = () => {
    if (department === "Bsc.IT") {
      return ["A"]; // Only allow division "A" for Bsc.IT
    }
    return DIVISIONS; // Allow all divisions for other departments
  };

  // Fetch subjects based on selected department
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
        setError(null);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setError("Failed to fetch subjects. Please try again.");
        setSubjects([]);
      }
    };

    fetchSubjects();
  }, [department]); // Re-fetch subjects whenever department changes

  // Handle input changes for each lecture field
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const updatedLectures = [...lectures];
    updatedLectures[index][name] = value;
    setLectures(updatedLectures);
  };

  // Add a new lecture entry
  const handleAddLecture = () => {
    setLectures([
      ...lectures,
      { startTime: "", endTime: "", subject: "", location: "" },
    ]);
  };

  // Remove a lecture entry
  const handleRemoveLecture = (index) => {
    const updatedLectures = lectures.filter((_, i) => i !== index);
    setLectures(updatedLectures);
  };

  // Handle navigation to Courses
  const handleBack = () => {
    navigate("/courses");
  };

  // Handle form submission with Firestore integration
  const handleSave = async (event) => {
    event.preventDefault();

    // Validate inputs
    if (
      !selectedDate ||
      !duration ||
      !department ||
      !year ||
      !division ||
      lectures.length === 0
    ) {
      setError(
        "Please fill in all fields: Date, Duration, Department, Year, Division, and at least one lecture."
      );
      return;
    }

    for (let lecture of lectures) {
      if (
        !lecture.startTime ||
        !lecture.endTime ||
        !lecture.subject ||
        !lecture.location
      ) {
        setError(
          "Please fill in all lecture fields: Start Time, End Time, Subject, and Location."
        );
        return;
      }
    }

    // Create a composite document ID
    const compositeId = `${department}_${year}_${division}_${selectedDate.replace(
      /-/g,
      ""
    )}`; // Remove hyphens from date for consistency

    const timetableData = {
      department, // Add department field
      year, // Add year field
      division, // Add division field
      duration: parseInt(duration), // Store as number (24 or 48)
      lectures,
      description, // Include description
      createdAt: serverTimestamp(), // Add server-side timestamp
    };

    try {
      // Use a single collection with a composite document ID
      const docRef = doc(db, "daytimetable", compositeId);

      // Save the timetable data to Firestore
      await setDoc(docRef, timetableData);

      alert("Timetable saved successfully to Firestore!");

      // Reset form after successful save
      setLectures([{ startTime: "", endTime: "", subject: "", location: "" }]);
      setSelectedDate("");
      setDuration("24");
      setDepartment("");
      setYear("");
      setDivision("");
      setDescription("");
      setError(null);
    } catch (error) {
      console.error("Error saving timetable to Firestore:", error);
      setError("Failed to save timetable. Please try again.");
    }
  };

  return (
    <div className=" w-screen bg-gray-100 flex ">
      {/* Full-screen Timetable Form */}
      <div className="w-full bg-white shadow-lg rounded-xl p-6 flex flex-col">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 self-start"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        <h1 className="text-5xl font-bold text-green-500 mb-6 text-center">
          ADD DAY TIMETABLE
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Duration Section (Top as per screenshot) */}
          <div className="mb-6">
            <label className="block text-gray-600 font-semibold mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="24">24 Hours</option>
              <option value="48">48 Hours</option>
            </select>
          </div>

          {/* Department, Year, Division, Date, and Description Section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Year</option>
                {Object.values(YEARS).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Division</option>
                {getFilteredDivisions().map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-600 font-semibold mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Description (e.g., Special lecture for exam preparation)"
                rows="3"
              />
            </div>
          </div>

          {lectures.map((lecture, index) => (
            <div
              key={index}
              className="border border-gray-300 p-4 rounded-lg space-y-4"
            >
              <h2 className="text-lg font-semibold mb-2">
                Lecture {index + 1}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={lecture.startTime}
                    onChange={(e) => handleInputChange(index, e)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-gray-600 font-semibold mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={lecture.endTime}
                    onChange={(e) => handleInputChange(index, e)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Subject */}
                <div className="col-span-2">
                  <label className="block text-gray-600 font-semibold mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={lecture.subject}
                    onChange={(e) => handleInputChange(index, e)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <label className="block text-gray-600 font-semibold mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={lecture.location}
                    onChange={(e) => handleInputChange(index, e)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Location"
                    required
                  />
                </div>
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLecture(index)}
                  className="mt-4 bg-red-500 text-white font-bold py-1 px-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Remove Lecture
                </button>
              )}
            </div>
          ))}

          {/* Add Lecture Button */}
          <button
            type="button"
            onClick={handleAddLecture}
            className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Lecture
          </button>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Save Timetable
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDayTimetable;
