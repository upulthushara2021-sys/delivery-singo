import { useState } from "react";
import api from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CompanyRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    mobile: "",
    address: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const companyName = form.companyName.trim();
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobile.trim();
    const address = form.address.trim();
    const password = form.password;

    if (!companyName || !email || !mobile || !address || !password) {
      setErrorMsg("All fields are required. Please fill in every column.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setErrorMsg("Mobile number must be exactly 10 digits (e.g. 0712345678).");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register-company", {
        companyName,
        email,
        mobile: cleanMobile,
        address,
        password,
      });

      alert("Company registered successfully! Please login.");
      navigate("/login");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={submit}
        className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Welcome
        </Link>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Company Registration
        </h2>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <input
            placeholder="Company Name"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            placeholder="Mobile"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            required
          />

          <input
            placeholder="Address"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
        >
          {loading ? "Registering..." : "Register Company"}
        </button>

        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
