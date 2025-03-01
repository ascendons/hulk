import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config"; // Ensure you have your Firebase config file
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DEPARTMENTS, DIVISIONS, SUBJECTS, ROLE } from "../constants"; // Updated to use ROLE instead of ROLES

const CreatesAccount = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    email: "",
    password: "",
    phone: "",
    department: "Select Department",
    division: "Select Divisions",
    subject: "Select Subjects",
    role: "Select Role",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Teacher's name is required.");
      return false;
    }
    if (!/^\d+$/.test(formData.teacherId)) {
      setError("Teacher ID must contain numbers only.");
      return false;
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      setError("Valid email is required.");
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (!/^\+91\d{10}$/.test(formData.phone)) {
      setError("Phone number must be in +91XXXXXXXXXX format (10 digits).");
      return false;
    }
    if (formData.department === "Select Department") {
      setError("Department is required.");
      return false;
    }
    if (formData.division === "Select Divisions") {
      setError("Division is required.");
      return false;
    }
    if (formData.subject === "Select Subjects") {
      setError("Subject is required.");
      return false;
    }
    if (formData.role === "Select Role") {
      setError("Role is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);
      toast.info(
        "Verification email sent. Please verify your email before logging in."
      );

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        teacherId: formData.teacherId,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        division: formData.division,
        subject: formData.subject,
        createdAt: new Date().toISOString(),
      });

      toast.success(
        "Account created successfully! Please check your email for verification."
      );
      navigate("/signup"); // Redirect to login page after successful registration
    } catch (err) {
      console.error("Error creating account:", err);
      setError(err.message || "Failed to create account. Please try again.");
      toast.error(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Create Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enter teacher’s name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter teacher's name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teacher ID (Numbers Only)
            </label>
            <input
              type="text"
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter teacher ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enter teacher’s email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter teacher's email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enter a password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter a password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number (+91 required)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter phone number (+91XXXXXXXXXX)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Divisions
            </label>
            <select
              name="division"
              value={formData.division}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Subjects
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {ROLE.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center mt-2">{error}</p>
          )}
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreatesAccount;
