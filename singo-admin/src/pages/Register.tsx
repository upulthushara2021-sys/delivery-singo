import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    address: "",
    email: "",
    mobile: "",
    password: "",
    role: "DRIVER",
  });

  const handleRegister = async () => {
    const name = formData.name.trim();
    const companyName = formData.companyName.trim();
    const address = formData.address.trim();
    const email = formData.email.trim().toLowerCase();
    const mobile = formData.mobile.trim();
    const password = formData.password;

    if (!name || !email || !mobile || !password) {
      alert("All fields are required. Please fill in every column.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      alert("Mobile number must be exactly 10 digits (e.g. 0712345678).");
      return;
    }

    try {
      let endpoint = "";

      if (formData.role === "COMPANY") {
        endpoint = "/auth/register-company";
      } else if (formData.role === "DRIVER") {
        endpoint = "/auth/register-driver";
      } else if (formData.role === "ADMIN") {
        endpoint = "/auth/register-admin";
      }

      await api.post(endpoint, {
        name,
        companyName: companyName || name,
        address,
        email,
        mobile: cleanMobile,
        password,
        role: formData.role,
      });

      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error: any) {
      console.error(
        "Registration failed:",
        error.response?.data?.message || error.message
      );
      alert(error.response?.data?.message || "Error creating account.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg w-[400px]">
        <h2 className="text-2xl font-bold mb-6">Register</h2>

        <div className="space-y-4">
          <input
            placeholder="Name"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <input
            placeholder="Company Name"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
          />

          <input
            placeholder="Address"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />

          <input
            placeholder="Email"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            placeholder="Mobile"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFormData({ ...formData, mobile: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <select
            className="w-full border p-3 rounded bg-white"
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
          >
            <option value="DRIVER">Driver</option>
            <option value="COMPANY">Company</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <button
          onClick={handleRegister}
          className="w-full bg-black text-white py-3 rounded mt-6"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}