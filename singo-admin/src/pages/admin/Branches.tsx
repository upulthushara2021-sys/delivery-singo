import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { GitBranch, Loader2, Plus, RefreshCw } from "lucide-react";

type Branch = {
  id: number;
  branchNumber: number;
  name: string;
  district: string;
  isActive: boolean;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adminForm, setAdminForm] = useState({ name: "", email: "", mobile: "", password: "", branchId: "" });
  const [savingAdmin, setSavingAdmin] = useState(false);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get<Branch[]>("/branches");
      setBranches(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      console.error("Failed to load branches", loadError);
      setError("Could not load branches");
    } finally {
      setLoading(false);
    }
  };

  const createBranchAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!adminForm.name || !adminForm.email || !adminForm.password || !adminForm.branchId) {
      setError("Branch admin name, email, password, and branch are required");
      return;
    }

    try {
      setSavingAdmin(true);
      await api.post("/admin/branch-admin", { ...adminForm, branchId: Number(adminForm.branchId) });
      setAdminForm({ name: "", email: "", mobile: "", password: "", branchId: "" });
      setMessage("Branch admin created successfully");
    } catch (saveError: any) {
      setError(saveError.response?.data?.message || "Could not create branch admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !district.trim()) {
      setError("Branch name and district are required");
      return;
    }

    try {
      setSaving(true);
      const response = await api.post<Branch>("/branches", {
        name: name.trim(),
        district: district.trim(),
      });
      setBranches((current) => [...current, response.data].sort((a, b) => a.branchNumber - b.branchNumber));
      setName("");
      setDistrict("");
      setMessage(`Branch ${response.data.name} created successfully`);
      window.dispatchEvent(new CustomEvent("branches:refresh"));
    } catch (saveError: any) {
      setError(saveError.response?.data?.message || "Could not create branch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <GitBranch className="text-blue-600" size={28} />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Branches</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add the branch name and district used by the delivery system.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBranches}
            disabled={loading}
            className="self-start rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Branch name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Central Branch"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                maxLength={100}
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              District
              <input
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder="e.g. Colombo"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                maxLength={100}
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Add Branch
            </button>
          </div>
          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
          {message && <p className="mt-4 text-sm font-medium text-green-600">{message}</p>}
        </form>

        <form onSubmit={createBranchAdmin} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create branch admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <input value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} placeholder="Full name" className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input type="email" value={adminForm.email} onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} placeholder="Email" className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input value={adminForm.mobile} onChange={(event) => setAdminForm({ ...adminForm, mobile: event.target.value })} placeholder="Mobile" className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input type="password" value={adminForm.password} onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} placeholder="Password" className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <select value={adminForm.branchId} onChange={(event) => setAdminForm({ ...adminForm, branchId: event.target.value })} className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">Select branch</option>
              {branches.filter((branch) => branch.isActive).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={savingAdmin} className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {savingAdmin ? "Creating..." : "Create branch admin"}
          </button>
        </form>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">System Branches</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={30} /></div>
          ) : branches.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No branches found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-5 py-3">Number</th>
                    <th className="px-5 py-3">Branch name</th>
                    <th className="px-5 py-3">District</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="px-5 py-3 font-semibold">{branch.branchNumber}</td>
                      <td className="px-5 py-3">{branch.name}</td>
                      <td className="px-5 py-3">{branch.district}</td>
                      <td className="px-5 py-3 text-green-600">{branch.isActive ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
