import React, { useState, useEffect } from "react";
import Select from "react-select";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../config";

const AddTeacher = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    teacherId: "",
    classTeacher: "No",
    department: "",
    divisions: [],
    subjects: [],
    role: "",
  });

  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const roleOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Teacher", label: "Teacher" },
    { value: "Coordinator", label: "Coordinator" },
  ];

  const divisionOptions = [
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "departments"));
        const departmentList = querySnapshot.docs.map((doc) => ({
          value: doc.data().departmentName,
          label: doc.data().departmentName,
        }));
        setDepartments(departmentList);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

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
        } finally {
          setLoadingSubjects(false);
        }
      };

      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [formData.department]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "teacherId" && !/^\d*$/.test(value)) {
      // Allow only numbers in teacher ID
      return;
    }

    setFormData({
      ...formData,
      [name]: name === "name" ? value.toUpperCase() : value,
    });
  };

  const handleDropdownChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!formData.phone.startsWith("+91") || formData.phone.length !== 13) {
      alert("Phone number must start with +91 and be 10 digits long.");
      return;
    }

    if (!formData.teacherId) {
      alert("Teacher ID is required and must contain only numbers.");
      return;
    }

    try {
      const teacherData = {
        ...formData,
        divisions: formData.divisions.map((div) => div.value),
        subjects: formData.subjects.map((subj) => subj.value),
        role: formData.role.value,
      };

      await addDoc(collection(db, "teachersinfo"), teacherData);
      alert("Teacher added successfully!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        teacherId: "",
        classTeacher: "No",
        department: "",
        divisions: [],
        subjects: [],
        role: "",
      });
    } catch (error) {
      console.error("Error adding teacher:", error);
      alert("Failed to add teacher.");
    }
  };

  return (
    <div className="flex flex-col  bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-2xl h-screen w-full ">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">
          Add Teacher
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Section */}
            <div>
              {/* Name Field */}
              <div className="mb-5">
                <label
                  htmlFor="name"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter teacher's name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Teacher ID Field */}
              <div className="mb-5">
                <label
                  htmlFor="teacherId"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Teacher ID (Numbers Only)
                </label>
                <input
                  type="text"
                  id="teacherId"
                  name="teacherId"
                  className="w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Teacher ID"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter teacher's email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="mb-5">
                <label
                  htmlFor="phone"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Phone Number (+91 required)
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  className="w-full px-4 py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91XXXXXXXXXX"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Right Section */}
            <div>
              {/* Department */}
              <div className="mb-5">
                <label
                  htmlFor="department"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Department
                </label>
                <Select
                  options={departments}
                  value={formData.department}
                  onChange={(value) =>
                    handleDropdownChange("department", value.value)
                  }
                  placeholder="Select Department"
                  required
                />
              </div>

              {/* Divisions */}
              <div className="mb-5">
                <label
                  htmlFor="divisions"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Divisions
                </label>
                <Select
                  options={divisionOptions}
                  isMulti
                  value={formData.divisions}
                  onChange={(value) => handleDropdownChange("divisions", value)}
                  placeholder="Select Divisions"
                  required
                />
              </div>

              {/* Subjects */}
              <div className="mb-5">
                <label
                  htmlFor="subjects"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Subjects
                </label>
                <Select
                  options={subjects}
                  isMulti
                  value={formData.subjects}
                  onChange={(value) => handleDropdownChange("subjects", value)}
                  placeholder={
                    loadingSubjects ? "Loading..." : "Select Subjects"
                  }
                  isDisabled={loadingSubjects}
                  required
                />
              </div>

              {/* Role */}
              <div className="mb-5">
                <label
                  htmlFor="role"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Role
                </label>
                <Select
                  options={roleOptions}
                  value={formData.role}
                  onChange={(value) => handleDropdownChange("role", value)}
                  placeholder="Select Role"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-blue-400"
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
