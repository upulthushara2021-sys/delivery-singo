import { useEffect, useState } from "react";
import api from "../../api/axios";
import Layout from "../../components/Layout";
import { Edit2, Trash2, DollarSign, Truck } from "lucide-react";

type Company = {
  id: number;
  name: string;
  email: string;
  address: string;
  mobile: string;
  totalDeliveries: number;
  completedDeliveries: number;
  revenue: number;
  deliveryCharge: number;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Company>>({});

  useEffect(() => {
    loadCompanies();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadCompanies, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/companies");
      setCompanies(res.data || []);
    } catch (error) {
      console.error("Failed to load companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setEditData(company);
  };

  const handleSave = async (id: number) => {
    try {
      await api.patch(`/admin/company/${id}`, editData);
      alert("✅ Company updated successfully!");
      setEditingId(null);
      loadCompanies();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update company");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;

    try {
      await api.delete(`/admin/company/${id}`);
      alert("✅ Company deleted successfully!");
      loadCompanies();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete company");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Companies Management
          </h1>
          <button
            onClick={loadCompanies}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : companies.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-200 dark:border-slate-800">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Deliveries</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">DeliveryCharge</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm font-medium">#{company.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === company.id ? (
                        <input
                          type="text"
                          value={editData.name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      ) : (
                        company.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === company.id ? (
                        <input
                          type="email"
                          value={editData.email || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      ) : (
                        company.email
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === company.id ? (
                        <input
                          type="text"
                          value={editData.mobile || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, mobile: e.target.value })
                          }
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      ) : (
                        company.mobile
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <Truck size={16} />
                        {company.totalDeliveries}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign size={16} />
                        {(company.revenue ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign size={16} />
                        {(company.deliveryCharge ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === company.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSave(company.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(company)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1 font-semibold"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 inline-flex items-center gap-1 font-semibold"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900 rounded-lg shadow p-6">
            No companies found
          </div>
        )}
      </div>
    </Layout>
  );
}
