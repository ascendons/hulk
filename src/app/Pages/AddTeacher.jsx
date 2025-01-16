import React, { useState } from "react";
import Select from "react-select"; // Import react-select for dropdown
import { collection, doc, setDoc } from "firebase/firestore"; // Firestore functions
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Authentication
import { db, auth } from "../../config"; // Firebase configuration

const AddTeacher = () => {
  const [formData, setFormData] = useState({
    teacherid: "",
    teachername: "",
    teacheremail: "",
    teacherpassword: "",
    phonenumber: "",
    department: "",
    subjects: [],
    classteacher: "",
    divisions: [],
    teachesYears: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  const departmentOptions = [
    { value: "BSCIT", label: "BSCIT" },
    { value: "BCOM", label: "BCOM" },
    { value: "BMS", label: "BMS" },
    { value: "BBA", label: "BBA" },
    { value: "BCA", label: "BCA" },
  ];

  const allSubjectOptions = {
    BSCIT: [
      { value: "Mathematics", label: "Mathematics" },
      { value: "Computer Science", label: "Computer Science" },
      { value: "Physics", label: "Physics" },
    ],
    BCOM: [
      { value: "Accounting", label: "Accounting" },
      { value: "Finance", label: "Finance" },
      { value: "Taxation", label: "Taxation" },
    ],
    BMS: [
      { value: "Marketing", label: "Marketing" },
      { value: "Human Resource", label: "Human Resource" },
      { value: "Operations", label: "Operations" },
    ],
    BBA: [
      { value: "Business Administration", label: "Business Administration" },
      { value: "Entrepreneurship", label: "Entrepreneurship" },
      { value: "Leadership", label: "Leadership" },
    ],
    BCA: [
      { value: "Programming", label: "Programming" },
      { value: "Database Management", label: "Database Management" },
      { value: "Networking", label: "Networking" },
    ],
  };

  const divisionOptionsForBSCIT = [{ value: "A", label: "A" }];
  const divisionOptionsForOthers = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
    { value: "E", label: "E" },
    { value: "F", label: "F" },
    { value: "G", label: "G" },
  ];

  const yearOptions = [
    { value: "First Year", label: "First Year" },
    { value: "Second Year", label: "Second Year" },
    { value: "Third Year", label: "Third Year" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Reset subjects and divisions if the department changes
    if (name === "department") {
      setFormData({ ...formData, [name]: value, subjects: [], divisions: [] });
    }
  };

  const handleMultiSelectChange = (selectedOptions, fieldName) => {
    const values = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFormData({ ...formData, [fieldName]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.teacherid ||
      !formData.teachername ||
      !formData.teacheremail ||
      !formData.teacherpassword ||
      !formData.phonenumber ||
      !formData.department ||
      !formData.subjects.length ||
      !formData.classteacher ||
      !formData.divisions.length ||
      !formData.teachesYears.length
    ) {
      alert("Please fill in all fields before submitting!");
      return;
    }

    setIsLoading(true);
    try {
      // Create a user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.teacheremail,
        formData.teacherpassword
      );
      const user = userCredential.user;

      // Add user to the "users" collection
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        email: formData.teacheremail,
        name: formData.teachername,
        role: "teacher",
      });

      // Add teacher details to the "teachersinfo" collection
      const teacherDocRef = doc(db, "teachersinfo", user.uid);
      await setDoc(teacherDocRef, {
        teacherid: formData.teacherid,
        teachername: formData.teachername,
        teacheremail: formData.teacheremail,
        phonenumber: formData.phonenumber,
        department: formData.department,
        subjects: formData.subjects,
        classteacher: formData.classteacher,
        divisions: formData.divisions,
        teachesYears: formData.teachesYears,
        userId: user.uid,
      });

      alert("Teacher added successfully!");

      // Reset form fields
      setFormData({
        teacherid: "",
        teachername: "",
        teacheremail: "",
        teacherpassword: "",
        phonenumber: "",
        department: "",
        subjects: [],
        classteacher: "",
        divisions: [],
        teachesYears: [],
      });
    } catch (error) {
      console.error("Error adding teacher:", error.message);
      alert(`Failed to add teacher. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-96">
        <h1 className="text-center text-2xl font-bold mb-6">Add Teacher</h1>
        <form onSubmit={handleSubmit}>
          {/* Teacher ID */}
          <input
            type="text"
            name="teacherid"
            value={formData.teacherid}
            onChange={handleChange}
            placeholder="Teacher ID"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Teacher Name */}
          <input
            type="text"
            name="teachername"
            value={formData.teachername}
            onChange={handleChange}
            placeholder="Teacher Name"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Teacher Email */}
          <input
            type="email"
            name="teacheremail"
            value={formData.teacheremail}
            onChange={handleChange}
            placeholder="Teacher Email"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Teacher Password */}
          <input
            type="password"
            name="teacherpassword"
            value={formData.teacherpassword}
            onChange={handleChange}
            placeholder="Teacher Password"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Phone Number */}
          <input
            type="text"
            name="phonenumber"
            value={formData.phonenumber}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Department Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Subjects Multi-Select Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subjects
            </label>
            <Select
              isMulti
              options={allSubjectOptions[formData.department] || []}
              value={(allSubjectOptions[formData.department] || []).filter(
                (option) => formData.subjects.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                handleMultiSelectChange(selectedOptions, "subjects")
              }
              className="w-full"
              required
            />
          </div>

          {/* Class Teacher */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Class Teacher
            </label>
            <select
              name="classteacher"
              value={formData.classteacher}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Yes/No
              </option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Divisions Multi-Select Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Divisions
            </label>
            <Select
              isMulti
              options={
                formData.department === "BSCIT"
                  ? divisionOptionsForBSCIT
                  : divisionOptionsForOthers
              }
              value={(formData.department === "BSCIT"
                ? divisionOptionsForBSCIT
                : divisionOptionsForOthers
              ).filter((option) => formData.divisions.includes(option.value))}
              onChange={(selectedOptions) =>
                handleMultiSelectChange(selectedOptions, "divisions")
              }
              className="w-full"
              required
            />
          </div>

          {/* Teaches Years Multi-Select Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Teaches Years
            </label>
            <Select
              isMulti
              options={yearOptions}
              value={yearOptions.filter((option) =>
                formData.teachesYears.includes(option.value)
              )}
              onChange={(selectedOptions) =>
                handleMultiSelectChange(selectedOptions, "teachesYears")
              }
              className="w-full"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTeacher;
