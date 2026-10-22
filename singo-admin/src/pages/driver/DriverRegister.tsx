import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function DriverRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    branchId: "",
    vehicleType: "",
  });
  const [branches, setBranches] = useState<{ id: number; name: string; district: string }[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setLoadingBranches(true);
    api
      .get("/auth/driver-options")
      .then((res) => {
        setBranches(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch branches:", err);
        setErrorMsg("Could not connect to server to load branches. Ensure backend server is running.");
      })
      .finally(() => {
        setLoadingBranches(false);
      });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobile.trim();
    const password = form.password;
    const branchId = form.branchId;
    const vehicleType = form.vehicleType;

    if (!name || !email || !mobile || !password || !branchId || !vehicleType) {
      setErrorMsg("All fields are required. Please fill in every column.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address (e.g. driver@domain.com).");
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setErrorMsg("Mobile number must be exactly 10 digits (e.g. 0712345678).");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        mobile: cleanMobile,
        password,
        branchId,
        vehicleType,
      };

      const res = await api.post("/auth/register-driver", payload);

      alert(
        res.data.assignedDeliveries
          ? `Driver registered successfully. ${res.data.assignedDeliveries} waiting delivery(s) assigned automatically.`
          : "Driver registered successfully. No waiting deliveries were available."
      );

      navigate("/driver/login");
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
          Driver Registration
        </h2>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <input
            placeholder="Driver Name"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <select
            value={form.branchId}
            className="w-full border p-3 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            required
          >
            <option value="">
              {loadingBranches ? "Loading branches..." : "Select branch / district"}
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} - {branch.district}
              </option>
            ))}
          </select>

          <select
            value={form.vehicleType}
            className="w-full border p-3 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            required
          >
            <option value="">Select vehicle</option>
            <option value="CAR">Car</option>
            <option value="LORRY">Lorry</option>
            <option value="TUK">Tuk</option>
            <option value="VAN">Van</option>
            <option value="BICYCLE">Bicycle</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg mt-6 hover:bg-green-700 disabled:opacity-50 font-semibold transition"
        >
          {loading ? "Registering..." : "Register Driver"}
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
