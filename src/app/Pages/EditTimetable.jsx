import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config";
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import ArrowLeftIcon

const EditTimetable = () => {
  const [day, setDay] = useState("");
  const [department, setDepartment] = useState("");
  const [division, setDivision] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate();

  const departments = ["Bsc.IT", "BCOM", "BMS"];
  const divisions = ["A", "B", "C", "D"];

  // Fetch subjects based on the selected department
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!department) return;

      try {
        const q = query(
          collection(db, "subjects"),
          where("department", "==", department)
        );

        const querySnapshot = await getDocs(q);
        const fetchedSubjects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSubjects(fetchedSubjects); // Correctly set as an array
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [department]);

  const handleSave = async () => {
    if (
      !day ||
      !department ||
      !division ||
      !location ||
      !subject ||
      !teacher ||
      !startTime ||
      !endTime
    ) {
      alert("Please fill in all fields before saving!");
      return;
    }

    const timetableEntry = {
      department,
      division,
      location,
      subject,
      teacher,
      timeSlot: `${startTime} to ${endTime}`,
    };

    try {
      const dayDocRef = doc(db, `timetable/${department}/${division}/${day}`);
      const dayDoc = await getDoc(dayDocRef);

      let lectures = [];
      if (dayDoc.exists()) {
        lectures = dayDoc.data().lectures || [];
      }

      lectures.push(timetableEntry);

      await setDoc(dayDocRef, { lectures });
      alert("Timetable entry saved successfully!");
    } catch (error) {
      console.error("Error saving timetable entry:", error);
      alert("Failed to save timetable entry. Please try again.");
    }

    setDay("");
    setDepartment("");
    setDivision("");
    setLocation("");
    setSubject("");
    setTeacher("");
    setStartTime("");
    setEndTime("");
  };

  // Handle back button click to navigate to dashboard
  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Left Half (Empty for now, can be used for sidebar or info) */}
      <div className=" flex items-center justify-center">
        {/* Add content here if needed (e.g., sidebar, instructions, etc.) */}
      </div>

      {/* Right Half (Timetable Form) */}
      <div className="w-full bg-white shadow-lg rounded-xl p-6 flex flex-col">
        {/* Back Button with Circular Arrow Icon */}
        <button
          onClick={handleBack}
          // className=" p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-5  text-gray-600" />
        </button>

        <h1 className="text-4xl font-bold text-blue-700 mb-6">
          Edit Timetable
        </h1>

        {/* Form Container */}
        <div className="space-y-4">
          {/* Select Day */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Day</option>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Select Department */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Select Division */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Division
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Division</option>
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Location"
            />
          </div>

          {/* Subject Dropdown */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.subjectName}>
                  {sub.subjectName}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Teacher
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Teacher Name"
            />
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-gray-600 font-semibold mb-2">
              Time Slot
            </label>
            <div className="flex space-x-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-1/2 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-1/2 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Save Timetable
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTimetable;
