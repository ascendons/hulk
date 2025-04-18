import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../config";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { DEPARTMENTS, DIVISIONS, YEARS } from "../constants";
import { ArrowLeftIcon } from "@heroicons/react/solid";
import ReactMarkdown from "react-markdown";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-red-600">
            Something went wrong.
          </h1>
          <p className="text-gray-600">
            Failed to render the component. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AddDayTimetable = () => {
  const [lectures, setLectures] = useState([
    { startTime: "", endTime: "", subject: "", location: "" },
  ]);
  const [duration, setDuration] = useState("24");
  const [selectedDate, setSelectedDate] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [division, setDivision] = useState("");
  const [description, setDescription] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const getFilteredDivisions = () => {
    if (department === "Bsc.IT") {
      return ["A"];
    }
    return DIVISIONS;
  };

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
  }, [department]);

  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const updatedLectures = [...lectures];
    updatedLectures[index][name] = value;
    setLectures(updatedLectures);
  };

  const handleAddLecture = () => {
    setLectures([
      ...lectures,
      { startTime: "", endTime: "", subject: "", location: "" },
    ]);
  };

  const handleRemoveLecture = (index) => {
    const updatedLectures = lectures.filter((_, i) => i !== index);
    setLectures(updatedLectures);
  };

  const handleBack = () => {
    navigate("/courses");
  };

  const formatText = (type) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

    let newText;
    if (type === "bold") {
      newText = `${description.substring(
        0,
        start
      )}**${selectedText}**${description.substring(end)}`;
    } else if (type === "italic") {
      newText = `${description.substring(
        0,
        start
      )}*${selectedText}*${description.substring(end)}`;
    }

    setDescription(newText);
  };

  const handleSave = async (event) => {
    event.preventDefault();

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
      toast.error(
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
        toast.error(
          "Please fill in all lecture fields: Start Time, End Time, Subject, and Location."
        );
        return;
      }
    }

    const compositeId = `${department}_${year}_${division}_${selectedDate.replace(
      /-/g,
      ""
    )}`;

    const durationMs = parseInt(duration) * 60 * 60 * 1000; // Convert hours to milliseconds
    const timetableData = {
      department,
      year,
      division,
      duration: parseInt(duration),
      lectures,
      description,
      createdAt: serverTimestamp(),
      deletionTimestamp: new Date(Date.now() + durationMs), // Store deletion time
    };

    try {
      const docRef = doc(db, "daytimetable", compositeId);
      const docSnap = await getDocs(
        query(
          collection(db, "daytimetable"),
          where("__name__", "==", compositeId)
        )
      );

      if (docSnap.empty) {
        await setDoc(docRef, timetableData);
        toast.success("Timetable created successfully to Firestore!");
      } else {
        await setDoc(docRef, timetableData, { merge: true });
        toast.success("Timetable updated successfully to Firestore!");
      }

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
      toast.error(`Firebase: Error (${error.code}).`);
      setError(
        `Failed to save timetable. Please try again. Error: ${error.message}`
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="w-screen bg-gray-100 flex">
        <div className="w-full bg-white shadow-lg rounded-xl p-6 flex flex-col">
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-600 font-semibold">
                    Description
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => formatText("bold")}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText("italic")}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm italic"
                      title="Italic"
                    >
                      I
                    </button>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  placeholder="Enter Description (e.g., **Text** for bold, *text* for italic)"
                  rows="6"
                />
                <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <p className="text-gray-600 text-sm mb-1">Preview:</p>
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="mb-4" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="ml-6" {...props} />
                      ),
                    }}
                  >
                    {description}
                  </ReactMarkdown>
                </div>
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

            <button
              type="button"
              onClick={handleAddLecture}
              className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Lecture
            </button>

            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save Timetable
            </button>
          </form>
        </div>
      </div>
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
    </ErrorBoundary>
  );
};

export default AddDayTimetable;
