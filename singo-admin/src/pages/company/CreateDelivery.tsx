import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type Branch = { id: number; branchNumber: number; name: string; district: string };
type Company = { id: number; name: string };

export default function CreateDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isBranchAdmin = user?.role === "BRANCH_ADMIN";
  const canSelectCompany = isAdmin || isBranchAdmin;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerMobile: "",
    dropoffAddress: "",
    amount: "",
    deliveryCharge: "",
    paymentType: "COD",
    pickupDistrict: isBranchAdmin
      ? branches.find((branch) => branch.id === Number(user?.branchId))?.district || ""
      : "",
    pickupBranch: isBranchAdmin
      ? branches.find((branch) => branch.id === Number(user?.branchId))?.name || ""
      : "",
    dropoffDistrict: "",
    dropoffBranch: "",
    companyId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [mobileMatched, setMobileMatched] = useState(false);
  const [mobileReturnCount, setMobileReturnCount] = useState(0);
  const [nameMatched, setNameMatched] = useState(false);
  const [nameReturnCount, setNameReturnCount] = useState(0);
  const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const branchesResponse = await api.get("/branches");
        const loadedBranches: Branch[] = branchesResponse.data;
        setBranches(loadedBranches);

        if (canSelectCompany) {
          const companiesResponse = await api.get("/admin/companies");
          setCompanies(companiesResponse.data);
        }

        if (isBranchAdmin) {
          if (!user?.branchId) {
            setError("Your account is not assigned to a branch.");
            return;
          }

          const assignedBranch = loadedBranches.find(
            (branch) => branch.id === Number(user.branchId)
          );

          if (!assignedBranch) {
            setError("Your assigned branch could not be found.");
            return;
          }

          setFormData((current) => ({
            ...current,
            pickupDistrict: assignedBranch.district,
            pickupBranch: assignedBranch.name,
          }));
        }
      } catch (err) {
        console.error("Could not load delivery options:", err);
        setError("Could not load branch or company information.");
      }
    };

    loadOptions();
  }, [canSelectCompany, isBranchAdmin, user?.branchId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const checkBlacklistStatus = async (
    mobile = formData.customerMobile,
    name = formData.customerName,
    showAlert = false,
  ) => {
    if (!mobile.trim() && !name.trim()) {
      setMobileMatched(false);
      setMobileReturnCount(0);
      setNameMatched(false);
      setNameReturnCount(0);
      setIsCustomerBlocked(false);
      setWarning("");
      return false;
    }

    try {
      let res;

      try {
        res = await api.post("/check-blacklist", {
          customerMobile: mobile,
          customerName: name,
        });
      } catch (err) {
        res = await api.post("/deliveries/check-blacklist", {
          customerMobile: mobile,
          customerName: name,
        });
      }

      const mobileCount = Number(res.data.mobileReturnCount || 0);
      const nameCount = Number(res.data.nameReturnCount || 0);

      const mobileMatch = Boolean(res.data.mobileMatched);
      const nameMatch = Boolean(res.data.nameMatched);

      setMobileMatched(mobileMatch);
      setMobileReturnCount(mobileCount);

      setNameMatched(nameMatch);
      setNameReturnCount(nameCount);

      // Only a mobile-number match can block COD.
      const blocked = mobileMatch && mobileCount >= 3;

      setIsCustomerBlocked(blocked);

      if (blocked) {
        const message =
          res.data.message ||
          `Allowed only PAID delivery. This mobile number has ${mobileCount} returns.`;

        setWarning(message);

        setFormData((current) => ({
          ...current,
          paymentType: "PAID",
        }));

        if (showAlert) {
          window.alert(message);
        }
      } else {
        setWarning("");
      }

      return blocked;
    } catch (error) {
      console.error("Blacklist check failed:", error);
      return false;
    }
  };

  useEffect(() => {
    const mobile = formData.customerMobile.trim();
    const name = formData.customerName.trim();

    if (mobile.length >= 3 || name.length >= 3) {
      checkBlacklistStatus(mobile, name);
    } else {
      setMobileMatched(false);
      setMobileReturnCount(0);
      setNameMatched(false);
      setNameReturnCount(0);
      setIsCustomerBlocked(false);
      setWarning("");
    }
  }, [formData.customerName, formData.customerMobile]);

  const handleBranchChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    prefix: "pickup" | "dropoff",
  ) => {
    const branch = branches.find((item) => item.district === event.target.value);
    setFormData((current) => ({
      ...current,
      [`${prefix}District`]: branch?.district || "",
      [`${prefix}Branch`]: branch?.name || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (
      !formData.customerName ||
      !formData.customerMobile ||
      !formData.dropoffAddress ||
      !formData.amount || !formData.deliveryCharge ||
      !formData.pickupDistrict || !formData.dropoffDistrict ||
      (canSelectCompany && !formData.companyId)
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      // Recheck the current number and name so a stale warning cannot allow blocked COD.
      const isBlocked = await checkBlacklistStatus(formData.customerMobile, formData.customerName, true);

      await api.post("/deliveries", {
        customerName: formData.customerName,
        customerMobile: formData.customerMobile,
        dropoffAddress: formData.dropoffAddress,
        amount: Number(formData.amount),
        deliveryCharge: Number(formData.deliveryCharge),
        paymentType: isBlocked ? "PAID" : formData.paymentType,
        pickupDistrict: formData.pickupDistrict,
        pickupBranch: formData.pickupBranch,
        dropoffDistrict: formData.dropoffDistrict,
        dropoffBranch: formData.dropoffBranch,
        ...(canSelectCompany ? { companyId: Number(formData.companyId) } : {}),
      });

      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      alert("✅ Delivery created successfully!");
      setFormData({
        customerName: "",
        customerMobile: "",
        dropoffAddress: "",
        amount: "",
        deliveryCharge: "",
        paymentType: "COD",
        pickupDistrict: "",
        pickupBranch: "",
        dropoffDistrict: "",
        dropoffBranch: "",
        companyId: "",
      });
      setWarning("");
      setMobileReturnCount(0);
      setNameReturnCount(0);
      setIsCustomerBlocked(false);
      navigate(
        isAdmin || isBranchAdmin
          ? "/admin/dashboard/deliveries"
          : "/company"
      );
    } catch (err: any) {
      console.error("Error:", err);
      const responseMessage = err.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(", ")
        : responseMessage;
      setError(message || err.message || "Failed to create delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
          {canSelectCompany ? "Create Delivery for Company" : "Create Delivery"}
        </h1>

        {warning && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 shadow-sm ${
              isCustomerBlocked
                ? "bg-red-50 border-red-600 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                : "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`shrink-0 mt-0.5 ${
                  isCustomerBlocked ? "text-red-600" : "text-amber-600"
                }`}
                size={22}
              />
              <div>
                <h4 className="font-bold text-base mb-1">
                  {isCustomerBlocked
                    ? "❌ Blacklisted Customer Notice"
                    : "⚠️ Customer Return Warning"}
                </h4>
                <p className="font-medium text-sm leading-relaxed">{warning}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow space-y-6">
          {canSelectCompany && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Company *
              </label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {(["pickup", "dropoff"] as const).map((prefix) => (
              <div key={prefix}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {prefix === "pickup" ? "Pickup Branch *" : "Dropoff Branch *"}
                </label>

                <select
                  value={formData[`${prefix}District`]}
                  onChange={(event) => handleBranchChange(event, prefix)}
                  disabled={prefix === "pickup" && isBranchAdmin}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select district branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.district}>
                      {branch.branchNumber}. {branch.name} Branch
                    </option>
                  ))}
                </select>

                {prefix === "pickup" && isBranchAdmin && (
                  <p className="mt-1 text-xs text-gray-500">
                    Pickup branch is fixed to your assigned branch.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 ${
                nameMatched
                  ? "border-amber-500 focus:ring-amber-500"
                  : "border-gray-300 dark:border-slate-600 focus:ring-blue-500"
              }`}
              required
            />

            {nameMatched && (
              <div className="mt-2 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-200">
                <AlertCircle size={18} className="shrink-0" />
                <span>
                  ⚠️ Customer name matches a blacklist record
                  {nameReturnCount > 0
                    ? ` (${nameReturnCount} previous return(s)).`
                    : "."}
                </span>
              </div>
            )}
          </div>

          {/* Customer Mobile */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Customer Mobile *
            </label>
            <input
              type="tel"
              name="customerMobile"
              value={formData.customerMobile}
              onChange={handleChange}
              placeholder="Enter customer phone"
              className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 ${
                isCustomerBlocked
                  ? "border-red-500 focus:ring-red-500"
                  : mobileMatched
                  ? "border-amber-500 focus:ring-amber-500"
                  : "border-gray-300 dark:border-slate-600 focus:ring-blue-500"
              }`}
              required
            />

            {mobileMatched && (
              <div
                className={`mt-2 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold ${
                  isCustomerBlocked
                    ? "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-200"
                    : "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-200"
                }`}
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>
                  {isCustomerBlocked
                    ? `❌ Allowed only PAID delivery. This mobile number has ${mobileReturnCount} previous returns.`
                    : `⚠️ This mobile number matches a blacklist record (${mobileReturnCount} return(s)).`}
                </span>
              </div>
            )}
          </div>

          {/* Dropoff Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Dropoff Address *
            </label>
            <input
              type="text"
              name="dropoffAddress"
              value={formData.dropoffAddress}
              onChange={handleChange}
              placeholder="Enter dropoff address"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Amount ($) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Delivery Charge */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Delivery Charge *
            </label>
            <input
              type="text"
              name="deliveryCharge"
              value={formData.deliveryCharge}
              onChange={handleChange}
              placeholder="Enter delivery charge"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Payment Type *
            </label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="COD" disabled={isCustomerBlocked}>
                Cash on Delivery (COD) {isCustomerBlocked ? "(Blocked - 3+ returns)" : ""}
              </option>
              <option value="PAID">Prepaid (PAID)</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Creating..." : "Create Delivery"}
            </button>
            <button
              type="button"
              onClick={() => navigate(isAdmin ? "/admin/dashboard/deliveries" : "/company")}
              className="flex-1 bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}