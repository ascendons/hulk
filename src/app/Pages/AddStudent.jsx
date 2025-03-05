import React, { useState, useEffect } from "react"; // Added useEffect for auth check
import { doc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { db, auth } from "../../config";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/solid"; // Import Heroicons for back arrow

const SignupStudent = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    studentid: "",
    phonenumber: "", // Will store only the 10-digit number entered by the user
    course: "",
    year: "",
    division: "",
    rollno: "",
    role: "student",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // State to track current user and role
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await doc(db, "users", user.uid).get();
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setUserRole(role ? role.toLowerCase() : null);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const capitalizedName = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData((prevData) => ({
        ...prevData,
        [name]: capitalizedName,
      }));
    } else if (name === "phonenumber") {
      // Allow only numbers and limit to 10 digits
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: formData.email,
        name: formData.name,
        role: formData.role,
      });

      const studentData = {
        studentid: formData.studentid,
        phonenumber: `+91${formData.phonenumber}`, // Store as +917869066778
        course: formData.course,
        year: formData.year,
        division: formData.division,
        rollno: formData.rollno,
        userId: user.uid,
      };

      await setDoc(doc(db, "students", user.uid), studentData);

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
        role: "student",
      });
      alert("Student account created successfully!");
    } catch (error) {
      console.error(`Error signing up student:`, error);
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please use a different email.");
      } else {
        setError(`Failed to sign up student: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      navigate("/adminstudents"); // Changed to redirect to /adminstudents after signup
    }
  };

  // Function to handle back navigation based on user role
  const handleBack = () => {
    if (userRole === "admin") {
      navigate("/adminstudents"); // Redirect to adminstudents for admin users
    } else {
      navigate("/admin"); // Fallback redirect to admin if role is not admin or not authenticated
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-4xl">
        {/* Back Arrow Button */}
        <button
          onClick={handleBack} // Use dynamic navigation based on user role
          className="mb-4 p-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        <h1 className="text-center text-2xl font-bold mb-6">Student Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentid"
                  value={formData.studentid}
                  onChange={handleChange}
                  placeholder="Student ID"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
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
                    name="phonenumber"
                    value={formData.phonenumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-3 py-2 border border-blue-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Course
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Division
                </label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Roll Number
                </label>
                <input
                  type="number"
                  name="rollno"
                  value={formData.rollno}
                  onChange={handleChange}
                  placeholder="Roll Number"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                />
              </div>
              <div className="h-12"></div>{" "}
              {/* Spacer to align with left column */}
            </div>
          </div>

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 mt-6"
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
