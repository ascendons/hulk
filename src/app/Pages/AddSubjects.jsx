import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../config"; // Adjust path based on your Firebase config

const AddSubjects = () => {
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId || !subjectName || !department || semesters.length === 0) {
      alert("Please fill all the fields!");
      return;
    }

    setIsLoading(true);

    try {
      const newSubject = {
        subjectId,
        subjectName,
        department,
        semesters,
      };

      await addDoc(collection(db, "subjects"), newSubject);
      alert("Subject added successfully!");

      // Reset form fields
      setSubjectId("");
      setSubjectName("");
      setDepartment("");
      setSemesters([]);
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Failed to add subject.");
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

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Add Subject</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 w-full max-w-md"
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Subject ID
          </label>
          <input
            type="text"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            placeholder="Enter Subject ID (e.g., SUB001)"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Subject Name
          </label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Enter Subject Name"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
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

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
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
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-4 py-2 text-white rounded-lg ${
            isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Saving..." : "Add Subject"}
        </button>
      </form>
    </div>
  );
};

export default AddSubjects;
