import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DEPARTMENTS, SUBJECTS, ROLE } from "../constants";

const CreatesAccount = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    email: "",
    password: "",
    phone: "",
    department: "Select Department",
    subject: "Select Subjects",
    role: "Select Role",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to generate next teacher ID
  const generateTeacherId = async () => {
    try {
      // Query the last teacher info document ordered by teacherId descending
      const q = query(
        collection(db, "teachersinfo"),
        orderBy("teacherId", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      let newId = "1000"; // Starting ID if no records exist

      if (!querySnapshot.empty) {
        const lastTeacher = querySnapshot.docs[0].data();
        const lastId = parseInt(lastTeacher.teacherId);
        newId = (lastId + 1).toString().padStart(4, "0");
      }

      setFormData((prev) => ({ ...prev, teacherId: newId }));
    } catch (err) {
      console.error("Error generating teacher ID:", err);
      setError("Failed to generate teacher ID");
    }
  };

  // Generate teacher ID when component mounts
  useEffect(() => {
    generateTeacherId();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const capitalizedName = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      setFormData({ ...formData, [name]: capitalizedName });
    } else if (name !== "teacherId") {
      // Prevent manual changes to teacherId
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Teacher's name is required.");
      return false;
    }
    if (!/^\d{4}$/.test(formData.teacherId)) {
      setError("Teacher ID must be a 4-digit number.");
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);
      toast.info(
        "Verification email sent. Please verify your email before logging in."
      );

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, "teachersinfo", user.uid), {
        teacherId: formData.teacherId,
        phone: formData.phone,
        department: formData.department,
        subject: formData.subject,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });

      toast.success(
        "Account created successfully! Please check your email for verification."
      );
      navigate("/signup");
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
              placeholder="Enter teacher's name (e.g., John Doe)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teacher ID (Auto-generated)
            </label>
            <input
              type="text"
              name="teacherId"
              value={formData.teacherId}
              readOnly // Make it read-only since it's auto-generated
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              placeholder="Auto-generated ID"
            />
          </div>
          {/* Rest of the form fields remain the same */}
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
