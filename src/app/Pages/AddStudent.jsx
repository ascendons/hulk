import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../config";

const SignupStudent = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    studentid: "",
    phonenumber: "",
    course: "",
    year: "",
    division: "",
    rollno: "",
    role: "student", // Role is set to student by default
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any field is empty
    const isAnyFieldEmpty = Object.values(formData).some(
      (value) => value.trim() === ""
    );
    if (isAnyFieldEmpty) {
      setError("Please fill in all fields before submitting!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Store additional user information in appropriate collection
      const userData = {
        email: formData.email,
        name: formData.name,
        expoPushToken: "", // Placeholder for push notification token
        role: formData.role,
      };

      // Determine the correct collection based on role
      const collectionName =
        formData.role === "student" ? "students" : "teachersinfo";

      // Store role-specific data
      const roleSpecificData = {
        ...(formData.role === "student"
          ? {
              studentid: formData.studentid,
              phonenumber: formData.phonenumber,
              studentcourse: formData.course,
              studentyear: formData.year,
              division: formData.division,
              studentrollno: formData.rollno,
              userId: user.uid,
            }
          : {
              // Teacher-specific fields would go here if needed
            }),
        ...userData, // Adding common user data
      };

      // Save to Firestore
      await setDoc(doc(db, collectionName, user.uid), roleSpecificData);

      // Clear form data and show success message
      setFormData({
        name: "",
        email: "",
        password: "",
        studentid: "",
        phonenumber: "",
        course: "",
        year: "",
        division: "",
        rollno: "",
        role: "student", // Reset role to student
      });
      alert(
        `${
          formData.role === "student" ? "Student" : "Teacher"
        } account created successfully!`
      );
    } catch (error) {
      console.error(`Error signing up ${formData.role}:`, error);
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please use a different email.");
      } else {
        setError(`Failed to sign up ${formData.role}: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-96">
        <h1 className="text-center text-2xl font-bold mb-6">Student Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            name="studentid"
            value={formData.studentid}
            onChange={handleChange}
            placeholder="Student ID"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            name="phonenumber"
            value={formData.phonenumber}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Student Course Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Course
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Course
              </option>
              <option value="Bsc.IT">Bsc.IT</option>
              <option value="BMS">BMS</option>
              <option value="BCA">BCA</option>
              <option value="B.Com">B.Com</option>
            </select>
          </div>

          {/* Student Year Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Year
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Year
              </option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
            </select>
          </div>

          {/* Division Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Division
            </label>
            <select
              name="division"
              value={formData.division}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Division
              </option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <input
            type="number"
            name="rollno"
            value={formData.rollno}
            onChange={handleChange}
            placeholder="Roll Number"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupStudent;
