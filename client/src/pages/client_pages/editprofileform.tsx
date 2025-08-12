import Endpoint from "@/endpoint";
import getToken from "@/tokenmanager";
import axios from "axios";
import { useRouter } from "next/router";
import { use, useEffect, useState } from "react";

export default function EditProfile({profileDetails}: any) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [userLastName, setLastName] = useState("Ismail");
  const [contactNo, setContact] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  
  useEffect(() => {
    // Set initial values from profileDetails
    setFirstName(profileDetails.FirstName || "");
    setLastName(profileDetails.LastName || "");
    setEmail(profileDetails.Email || "");
    setContact(profileDetails.ContactNo || "");
  }, []);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,15}$/; // Allows 10-15 digit numbers

  // Form validation function
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) newErrors.firstName = "First Name is required.";
    if (!userLastName.trim()) newErrors.userLastName = "Last Name is required.";
    if (!email.trim() || !emailRegex.test(email))
      newErrors.email = "Enter a valid email address.";
    if (!contactNo.trim() || !phoneRegex.test(contactNo))
      newErrors.contactNo = "Enter a valid contact number (10-15 digits).";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to handle form submission
  const editProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return; // Stop submission if validation fails

    try {
      const response = await axios.patch(
        Endpoint.userProfile,
        {
          FirstName: firstName,
          LastName: userLastName,
          Email: email,
          ContactNo: contactNo,
        },
        { headers: { Authorization: `Bearer ${getToken("token")}` } }
      );

      if (response.status === 200) {
        alert("Updated Successfully");
        router.push("../");
      }
    } catch (error) {
      alert("Error updating profile");
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          e-Pasar
        </a>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              EDIT PROFILE
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={editProfile}>
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={userLastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {errors.userLastName && <p className="text-red-500 text-sm">{errors.userLastName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={contactNo}
                    onChange={(e) => setContact(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {errors.contactNo && <p className="text-red-500 text-sm">{errors.contactNo}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                Edit Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
