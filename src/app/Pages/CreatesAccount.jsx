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
import { DEPARTMENTS, SUBJECTS } from "../constants";
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import Heroicons for back arrow

const CreatesAccount = () => {
  const navigate = useNavigate();

  // State for Teacher form
  const [teacherFormData, setTeacherFormData] = useState({
    name: "",
    teacherId: "",
    email: "",
    password: "",
    phone: "", // Will store only the 10-digit number entered by the user
    department: "Select Department",
    subject: "Select Subjects",
  });

  // State for Admin form
  const [adminFormData, setAdminFormData] = useState({
    name: "",
    adminId: "",
    email: "",
    password: "",
    phone: "", // Will store only the 10-digit number entered by the user
  });

  const [isLoading, setIsLoading] = useState({ teacher: false, admin: false });
  const [error, setError] = useState({ teacher: "", admin: "" });

  // Function to generate next teacher ID
  const generateTeacherId = async () => {
    try {
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

      setTeacherFormData((prev) => ({ ...prev, teacherId: newId }));
    } catch (err) {
      console.error("Error generating teacher ID:", err);
      setError({ ...error, teacher: "Failed to generate teacher ID" });
    }
  };

  // Function to generate next admin ID
  const generateAdminId = async () => {
    try {
      const q = query(
        collection(db, "adminsinfo"),
        orderBy("adminId", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      let newId = "A1000"; // Starting ID for admins (e.g., A1000, A1001, etc.)

      if (!querySnapshot.empty) {
        const lastAdmin = querySnapshot.docs[0].data();
        const lastId = parseInt(lastAdmin.adminId.replace("A", ""));
        newId = `A${(lastId + 1).toString().padStart(4, "0")}`;
      }

      setAdminFormData((prev) => ({ ...prev, adminId: newId }));
    } catch (err) {
      console.error("Error generating admin ID:", err);
      setError({ ...error, admin: "Failed to generate admin ID" });
    }
  };

  // Generate IDs when component mounts
  useEffect(() => {
    generateTeacherId();
    generateAdminId();
  }, []);

  // Handle changes for Teacher form
  const handleTeacherChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const capitalizedName = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      setTeacherFormData({ ...teacherFormData, [name]: capitalizedName });
    } else if (name === "phone") {
      // Allow only numbers and limit to 10 digits
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setTeacherFormData({ ...teacherFormData, [name]: numericValue });
    } else if (name !== "teacherId") {
      setTeacherFormData({ ...teacherFormData, [name]: value });
    }
  };

  // Handle changes for Admin form
  const handleAdminChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      const capitalizedName = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
      setAdminFormData({ ...adminFormData, [name]: capitalizedName });
    } else if (name === "phone") {
      // Allow only numbers and limit to 10 digits
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setAdminFormData({ ...adminFormData, [name]: numericValue });
    } else if (name !== "adminId") {
      setAdminFormData({ ...adminFormData, [name]: value });
    }
  };

  // Validate Teacher form
  const validateTeacherForm = () => {
    if (!teacherFormData.name.trim()) {
      setError({ ...error, teacher: "Teacher's name is required." });
      return false;
    }
    if (!/^\d{4}$/.test(teacherFormData.teacherId)) {
      setError({ ...error, teacher: "Teacher ID must be a 4-digit number." });
      return false;
    }
    if (
      !teacherFormData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherFormData.email)
    ) {
      setError({ ...error, teacher: "Valid email is required." });
      return false;
    }
    if (
      !teacherFormData.password.trim() ||
      teacherFormData.password.length < 6
    ) {
      setError({
        ...error,
        teacher: "Password must be at least 6 characters long.",
      });
      return false;
    }
    if (!/^\d{10}$/.test(teacherFormData.phone)) {
      setError({ ...error, teacher: "Phone number must be 10 digits." });
      return false;
    }
    if (teacherFormData.department === "Select Department") {
      setError({ ...error, teacher: "Department is required." });
      return false;
    }
    if (teacherFormData.subject === "Select Subjects") {
      setError({ ...error, teacher: "Subject is required." });
      return false;
    }
    return true;
  };

  // Validate Admin form
  const validateAdminForm = () => {
    if (!adminFormData.name.trim()) {
      setError({ ...error, admin: "Admin's name is required." });
      return false;
    }
    if (
      !adminFormData.adminId.trim() ||
      !adminFormData.adminId.startsWith("A")
    ) {
      setError({
        ...error,
        admin: "Admin ID must start with 'A' and be in AXXXX format.",
      });
      return false;
    }
    if (
      !adminFormData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminFormData.email)
    ) {
      setError({ ...error, admin: "Valid email is required." });
      return false;
    }
    if (!adminFormData.password.trim() || adminFormData.password.length < 6) {
      setError({
        ...error,
        admin: "Password must be at least 6 characters long.",
      });
      return false;
    }
    if (!/^\d{10}$/.test(adminFormData.phone)) {
      setError({ ...error, admin: "Phone number must be 10 digits." });
      return false;
    }
    return true;
  };

  // Handle Teacher submission
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setIsLoading({ ...isLoading, teacher: true });
    setError({ ...error, teacher: "" });

    if (!validateTeacherForm()) {
      setIsLoading({ ...isLoading, teacher: false });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        teacherFormData.email,
        teacherFormData.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);
      toast.info(
        "Verification email sent for teacher. Please verify your email before logging in."
      );

      await setDoc(doc(db, "users", user.uid), {
        name: teacherFormData.name,
        email: teacherFormData.email,
        role: "teacher",
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, "teachersinfo", user.uid), {
        teacherId: teacherFormData.teacherId,
        phone: `+91${teacherFormData.phone}`, // Store as +917869066778
        department: teacherFormData.department,
        subject: teacherFormData.subject,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });

      toast.success(
        "Teacher account created successfully! Please check your email for verification."
      );
      navigate("/admin"); // Redirect back to Admin panel
      setTeacherFormData({
        name: "",
        teacherId: "",
        email: "",
        password: "",
        phone: "",
        department: "Select Department",
        subject: "Select Subjects",
      });
    } catch (err) {
      console.error("Error creating teacher account:", err);
      setError({
        ...error,
        teacher:
          err.message || "Failed to create teacher account. Please try again.",
      });
      toast.error(
        err.message || "Failed to create teacher account. Please try again."
      );
    } finally {
      setIsLoading({ ...isLoading, teacher: false });
    }
  };

  // Handle Admin submission
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setIsLoading({ ...isLoading, admin: true });
    setError({ ...error, admin: "" });

    if (!validateAdminForm()) {
      setIsLoading({ ...isLoading, admin: false });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminFormData.email,
        adminFormData.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);
      toast.info(
        "Verification email sent for admin. Please verify your email before logging in."
      );

      await setDoc(doc(db, "users", user.uid), {
        name: adminFormData.name,
        email: adminFormData.email,
        role: "admin",
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, "adminsinfo", user.uid), {
        adminId: adminFormData.adminId,
        phone: `+91${adminFormData.phone}`, // Store as +917869066778
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });

      toast.success(
        "Admin account created successfully! Please check your email for verification."
      );
      navigate("/admin"); // Redirect back to Admin panel
      setAdminFormData({
        name: "",
        adminId: "",
        email: "",
        password: "",
        phone: "",
      });
    } catch (err) {
      console.error("Error creating admin account:", err);
      setError({
        ...error,
        admin:
          err.message || "Failed to create admin account. Please try again.",
      });
      toast.error(
        err.message || "Failed to create admin account. Please try again."
      );
    } finally {
      setIsLoading({ ...isLoading, admin: false });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-4xl p-8 bg-white rounded-2xl shadow-lg">
        {/* Back Arrow Button */}
        <button
          onClick={() => navigate("/admin")}
          className="mb-4 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Create Account
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teacher Form */}
          <div className="p-6 bg-gray-50 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Add Teacher
            </h3>
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Enter teacher’s name
                </label>
                <input
                  type="text"
                  name="name"
                  value={teacherFormData.name}
                  onChange={handleTeacherChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter teacher's name (e.g., John Doe)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Teacher ID (Auto-generated)
                </label>
                <input
                  type="text"
                  name="teacherId"
                  value={teacherFormData.teacherId}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
                  placeholder="Auto-generated ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Enter teacher’s email
                </label>
                <input
                  type="email"
                  name="email"
                  value={teacherFormData.email}
                  onChange={handleTeacherChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter teacher's email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Enter a password
                </label>
                <input
                  type="password"
                  name="password"
                  value={teacherFormData.password}
                  onChange={handleTeacherChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter a password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Phone Number (+91 required)
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={teacherFormData.phone}
                    onChange={handleTeacherChange}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-3 py-2 border border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Select Department
                </label>
                <select
                  name="department"
                  value={teacherFormData.department}
                  onChange={handleTeacherChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Select Subjects
                </label>
                <select
                  name="subject"
                  value={teacherFormData.subject}
                  onChange={handleTeacherChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading.teacher}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  {isLoading.teacher ? "Creating..." : "Create Teacher Account"}
                </button>
              </div>
              {error.teacher && (
                <p className="text-sm text-red-500 text-center mt-2">
                  {error.teacher}
                </p>
              )}
            </form>
          </div>

          {/* Admin Form */}
          <div className="p-6 bg-gray-50 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Add Admin
            </h3>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Enter admin’s name
                </label>
                <input
                  type="text"
                  name="name"
                  value={adminFormData.name}
                  onChange={handleAdminChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter admin's name (e.g., John Doe)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Admin ID (Auto-generated)
                </label>
                <input
                  type="text"
                  name="adminId"
                  value={adminFormData.adminId}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100"
                  placeholder="Auto-generated ID (e.g., A1000)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Enter admin’s email
                </label>
                <input
                  type="email"
                  name="email"
                  value={adminFormData.email}
                  onChange={handleAdminChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter admin's email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Enter a password
                </label>
                <input
                  type="password"
                  name="password"
                  value={adminFormData.password}
                  onChange={handleAdminChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="Enter a password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Phone Number (+91 required)
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={adminFormData.phone}
                    onChange={handleAdminChange}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-3 py-2 border border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading.admin}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  {isLoading.admin ? "Creating..." : "Create Admin Account"}
                </button>
              </div>
              {error.admin && (
                <p className="text-sm text-red-500 text-center mt-2">
                  {error.admin}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default CreatesAccount;
