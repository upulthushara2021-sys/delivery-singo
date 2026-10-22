import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data && response.data.accessToken) {
        login(response.data);

        // Navigate based on role
        const role = response.data.user.role;
        if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (role === "BRANCH_ADMIN") {
          navigate("/admin/dashboard/drivers");
        } else if (role === "COMPANY") {
          navigate("/company");
        } else if (role === "DRIVER") {
          navigate("/driver");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Welcome
        </Link>

        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          SINGO Login
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600 space-y-2">
          <p>Don't have an account yet?</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/company/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Register Company
            </Link>
            <span>•</span>
            <Link
              to="/driver/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Register Driver
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6 bg-gray-50 p-3 rounded-lg">
          <strong>Test Admin Credentials:</strong>
          <br />
          Email: admin@gmail.com | Password: password
        </p>
      </div>
    </div>
  );
}
