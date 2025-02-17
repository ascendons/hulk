import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config"; // Assuming you have exported your Firebase auth and Firestore db instances
import { DEPARTMENTS, DIVISIONS, ROLE } from "../constants.js";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import Select from "react-select";
import Swal from "sweetalert2";

const CreateAccount = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [divisions, setDivisions] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    // Fetch subjects when department changes
    const fetchSubjects = async () => {
      if (department) {
        const q = query(
          collection(db, "subjects"),
          where("department", "==", department)
        );
        const querySnapshot = await getDocs(q);
        const subjectsList = querySnapshot.docs.map((doc) => ({
          value: doc.data().subjectId,
          label: doc.data().subjectName,
        }));
        setAvailableSubjects(subjectsList);
      } else {
        setAvailableSubjects([]);
      }
    };
    fetchSubjects();
  }, [department]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting to sign up with:", {
        email,
        password,
        name,
        teacherId,
        phoneNumber,
        department,
        divisions,
        subjects,
        role,
      });

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created:", userCredential.user);

      // Preparing the data to be stored in Firestore
      const userData = {
        name: name,
        teacherId: teacherId,
        phoneNumber: phoneNumber,
        email: email,
        department: department,
        divisions: divisions,
        subjects: subjects.map((sub) => sub.value), // Convert selected options to values
        role: role,
        classTeacher: "Yes", // Assuming all new accounts are class teachers by default
      };

      // Storing the user data in the 'teachersinfo' collection
      await setDoc(doc(db, "teachersinfo", userCredential.user.uid), userData);

      // Show success popup
      Swal.fire({
        icon: "success",
        title: "Account Created",
        text: "Your account has been created successfully!",
      });

      // Optionally, reset form fields here
      setName("");
      setTeacherId("");
      setEmail("");
      setPassword("");
      setPhoneNumber("");
      setDepartment("");
      setDivisions("");
      setSubjects([]);
      setRole("");
    } catch (error) {
      console.error("Error signing up:", error.message);
      // Show error popup
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error creating account: " + error.message,
      });
    }
  };

  // Department options
  const departmentOptions = DEPARTMENTS.map((dept) => ({
    value: dept,
    label: dept,
  }));

  // Divisions options
  const divisionOptions = DIVISIONS.map((div) => ({ value: div, label: div }));

  // Role options
  const roleOptions = ROLE.map((role) => ({ value: role, label: role }));

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleSignUp}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter teacher's name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Teacher ID (Numbers Only)"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Enter teacher's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="tel"
            placeholder="Phone Number (+91 required)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <Select
            options={departmentOptions}
            placeholder="Select Department"
            value={department ? { value: department, label: department } : null}
            onChange={(selectedOption) => setDepartment(selectedOption.value)}
            className="w-full"
            required
          />
          <Select
            options={divisionOptions}
            placeholder="Select Divisions"
            value={divisions ? { value: divisions, label: divisions } : null}
            onChange={(selectedOption) => setDivisions(selectedOption.value)}
            className="w-full"
            required
          />
          <Select
            options={availableSubjects}
            placeholder="Select Subjects"
            isMulti
            value={subjects}
            onChange={(selectedOptions) => setSubjects(selectedOptions)}
            className="w-full"
            required
          />
          <Select
            options={roleOptions}
            placeholder="Select Role"
            value={role ? { value: role, label: role } : null}
            onChange={(selectedOption) => setRole(selectedOption.value)}
            className="w-full"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccount;
