import React, { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore"; // Firestore functions
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Authentication
import { db, auth } from "../../config"; // Firebase configuration

const AddStudent = () => {
  const [formData, setFormData] = useState({
    studentid: "",
    studentname: "",
    studentemail: "",
    studentpassword: "",
    phonenumber: "", // New phone number field
    studentcourse: "",
    studentyear: "",
    division: "",
    studentrollno: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.studentid ||
      !formData.studentname ||
      !formData.studentemail ||
      !formData.studentpassword ||
      !formData.phonenumber || // Validate phone number
      !formData.studentcourse ||
      !formData.studentyear ||
      !formData.division ||
      !formData.studentrollno
    ) {
      alert("Please fill in all fields before submitting!");
      return;
    }

    setIsLoading(true);
    try {
      // Create a user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.studentemail,
        formData.studentpassword
      );
      const user = userCredential.user;

      // Add student information to Firestore
      const studentDocRef = doc(db, "students", user.uid);
      await setDoc(studentDocRef, {
        studentid: formData.studentid,
        studentname: formData.studentname,
        studentemail: formData.studentemail,
        phonenumber: formData.phonenumber, // Add phone number to Firestore
        studentcourse: formData.studentcourse,
        studentyear: formData.studentyear,
        division: formData.division,
        studentrollno: formData.studentrollno,
        userId: user.uid,
      });

      alert("Student added successfully!");

      // Reset form fields
      setFormData({
        studentid: "",
        studentname: "",
        studentemail: "",
        studentpassword: "",
        phonenumber: "",
        studentcourse: "",
        studentyear: "",
        division: "",
        studentrollno: "",
      });
    } catch (error) {
      console.error("Error adding student:", error.message);
      alert(`Failed to add student. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-96">
        <h1 className="text-center text-2xl font-bold mb-6">Add Student</h1>
        <form onSubmit={handleSubmit}>
          {/* Student ID */}
          <input
            type="text"
            name="studentid"
            value={formData.studentid}
            onChange={handleChange}
            placeholder="Student ID"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Student Name */}
          <input
            type="text"
            name="studentname"
            value={formData.studentname}
            onChange={handleChange}
            placeholder="Student Name"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Student Email */}
          <input
            type="email"
            name="studentemail"
            value={formData.studentemail}
            onChange={handleChange}
            placeholder="Student Email"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {/* Student Password */}
          <input
            type="password"
            name="studentpassword"
            value={formData.studentpassword}
            onChange={handleChange}
            placeholder="Student Password"
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

          {/* Student Course Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Student Course
            </label>
            <select
              name="studentcourse"
              value={formData.studentcourse}
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
              Student Year
            </label>
            <select
              name="studentyear"
              value={formData.studentyear}
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

          {/* Student Roll Number */}
          <input
            type="number"
            name="studentrollno"
            value={formData.studentrollno}
            onChange={handleChange}
            placeholder="Student Roll No"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

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

export default AddStudent;
