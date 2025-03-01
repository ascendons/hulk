import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../config";
import { DEPARTMENTS, DIVISIONS } from "../constants";

// Validation utilities
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePhone = (phone) => {
  // Indian phone number validation: +91 followed by 10 digits, first digit after +91 not 0 or 1
  const indianPhoneRegex = /^\+91[2-9]\d{9}$/;
  return indianPhoneRegex.test(phone);
};
const validatePassword = (password) => password.length >= 6;

// Function to capitalize first letter of each word
const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Custom hook for form validation
const useFormValidation = (initialData) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email address";
    if (!validatePhone(formData.phone))
      newErrors.phone = "Phone must start with +91 and be a 10-digit number (first digit after +91 cannot be 0 or 1)";
    if (!validatePassword(formData.password))
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.divisions.length) newErrors.divisions = "Select at least one division";
    if (!formData.subjects.length) newErrors.subjects = "Select at least one subject";
    if (!formData.role) newErrors.role = "Select a role";
    setErrors(newErrors); // Update errors state
    return Object.keys(newErrors).length === 0; // Return true if no errors
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? capitalizeWords(value) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      classTeacher: "No",
      department: "",
      divisions: [],
      subjects: [],
      role: null,
    });
    setErrors({});
  };

  return { formData, errors, handleChange, handleDropdownChange, validateForm, resetForm };
};

const AddTeacher = () => {
  const { formData, errors, handleChange, handleDropdownChange, validateForm, resetForm } =
    useFormValidation({
      name: "",
      email: "",
      phone: "",
      password: "",
      classTeacher: "No",
      department: "",
      divisions: [],
      subjects: [],
      role: null,
    });

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const departmentOptions = DEPARTMENTS.map((dept) => ({
    value: dept,
    label: dept,
  }));

  const roleOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Teacher", label: "Teacher" },
    { value: "Coordinator", label: "Coordinator" },
  ];

  const divisionOptions = DIVISIONS.map((div) => ({
    value: div,
    label: div,
  }));

  useEffect(() => {
    if (formData.department) {
      const fetchSubjects = async () => {
        setLoadingSubjects(true);
        try {
          const querySnapshot = await getDocs(collection(db, "subjects"));
          const subjectList = querySnapshot.docs
            .filter((doc) => doc.data().department === formData.department)
            .map((doc) => ({
              value: doc.data().subjectName,
              label: doc.data().subjectName,
            }));
          setSubjects(subjectList);
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubmitError("Failed to load subjects. Please try again.");
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [formData.department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // If validation fails, errors are already set

    setSubmitError(null);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role.value,
      };

      const teacherData = {
        phone: formData.phone,
        password: formData.password,
        classTeacher: formData.classTeacher,
        department: formData.department,
        divisions: formData.divisions.map((div) => div.value),
        subjects: formData.subjects.map((subj) => subj.value),
        userId: null, // Will be set after userDoc is created
      };

      const userDoc = await addDoc(collection(db, "users"), userData);
      await addDoc(collection(db, "teachersinfo"), {
        ...teacherData,
        userId: userDoc.id,
      });

      alert("Teacher added successfully!");
      resetForm();
    } catch (error) {
      console.error("Error adding teacher:", error);
      setSubmitError("Failed to add teacher. Please check your input or try again later.");
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-6 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Add Teacher</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Enter teacher's name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Enter teacher's email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Enter a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                  Phone Number (+91 required)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  pattern="^\+91[2-9]\d{9}$"
                  title="Enter a valid Indian phone number starting with +91 followed by 10 digits (first digit after +91 cannot be 0 or 1)"
                  className={`w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="+912345678901"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label htmlFor="department" className="block text-gray-700 font-medium mb-2">
                  Department
                </label>
                <Select
                  options={departmentOptions}
                  value={departmentOptions.find((option) => option.value === formData.department)}
                  onChange={(value) => handleDropdownChange("department", value.value)}
                  placeholder="Select Department"
                  className={errors.department ? "border-red-500" : ""}
                  required
                />
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="divisions" className="block text-gray-700 font-medium mb-2">
                  Divisions
                </label>
                <Select
                  options={divisionOptions}
                  isMulti
                  value={formData.divisions}
                  onChange={(value) => handleDropdownChange("divisions", value)}
                  placeholder="Select Divisions"
                  className={errors.divisions ? "border-red-500" : ""
                  }
                  required
                />
                {errors.divisions && <p className="text-red-500 text-sm mt-1">{errors.divisions}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="subjects" className="block text-gray-700 font-medium mb-2">
                  Subjects
                </label>
                <Select
                  options={subjects}
                  isMulti
                  value={formData.subjects}
                  onChange={(value) => handleDropdownChange("subjects", value)}
                  placeholder={loadingSubjects ? "Loading..." : "Select Subjects"}
                  isDisabled={loadingSubjects}
                  className={errors.subjects ? "border-red-500" : ""}
                  required
                />
                {errors.subjects && <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="role" className="block text-gray-700 font-medium mb-2">
                  Role
                </label>
                <Select
                  options={roleOptions}
                  value={formData.role}
                  onChange={(value) => handleDropdownChange("role", value)}
                  placeholder="Select Role"
                  className={errors.role ? "border-red-500" : ""}
                  required
                />
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>

          {submitError && <p className="text-red-500 text-center mt-4">{submitError}</p>}

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-blue-400 disabled:opacity-50"
              disabled={loadingSubjects}
            >
              Add Teacher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeacher;