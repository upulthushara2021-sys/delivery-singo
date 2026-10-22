import { useEffect, useState } from "react";
import api from "../../api/axios";
import Layout from "../../components/Layout";
import { Edit2, Trash2, DollarSign, Truck } from "lucide-react";

type Driver = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  branchId?: number;
  branch?: string;
  district?: string;
  vehicleType?: string;
  totalDeliveries: number;
  completedDeliveries: number;
  earnings: number;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Driver>>({});
  const [branches, setBranches] = useState<{ id: number; name: string; district: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    loadDrivers();
    api.get("/branches").then((res) => setBranches(res.data || []));
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/drivers");
      setDrivers(res.data || []);
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setEditData(driver);
  };

  const handleSave = async (id: number) => {
    try {
      await api.patch(`/admin/driver/${id}`, editData);
      alert("✅ Driver updated successfully!");
      setEditingId(null);
      loadDrivers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update driver");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;

    try {
      await api.delete(`/admin/driver/${id}`);
      alert("✅ Driver deleted successfully!");
      loadDrivers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete driver");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Drivers Management
          </h1>
          <select
            value={selectedBranch}
            onChange={(event) => setSelectedBranch(event.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} - {branch.district}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : drivers.filter((driver) => !selectedBranch || driver.branchId === Number(selectedBranch)).length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-200 dark:border-slate-800">
            <table className="w-full min-w-[850px]">
              <thead className="bg-gray-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Branch / District</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Deliveries</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Earnings</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {drivers.filter((driver) => !selectedBranch || driver.branchId === Number(selectedBranch)).map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm font-medium">#{driver.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === driver.id ? (
                        <input
                          type="text"
                          value={editData.name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      ) : (
                        driver.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === driver.id ? (
                        <input
                          type="email"
                          value={editData.email || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      ) : (
                        driver.email
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === driver.id ? (
                        <input
                          type="text"
                          value={editData.mobile || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, mobile: e.target.value })
                          }
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      ) : (
                        driver.mobile
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === driver.id ? (
                        <select
                          value={editData.branchId || ""}
                          onChange={(e) => setEditData({ ...editData, branchId: Number(e.target.value) })}
                          className="border p-1 rounded w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                          <option value="">Select branch</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name} - {branch.district}
                            </option>
                          ))}
                        </select>
                      ) : (
                        `${driver.branch || "Unassigned"}${driver.district ? ` - ${driver.district}` : ""}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === driver.id ? (
                        <select
                          value={editData.vehicleType || ""}
                          onChange={(e) => setEditData({ ...editData, vehicleType: e.target.value })}
                          className="border p-1 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                          <option value="">Select vehicle</option>
                          <option value="CAR">Car</option>
                          <option value="LORRY">Lorry</option>
                          <option value="TUK">Tuk</option>
                          <option value="VAN">Van</option>
                          <option value="BICYCLE">Bicycle</option>
                        </select>
                      ) : (
                        driver.vehicleType || "Not set"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <Truck size={16} />
                        {driver.totalDeliveries}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign size={16} />
                        {driver.earnings.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === driver.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSave(driver.id)}
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
                            onClick={() => handleEdit(driver)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 inline-flex items-center gap-1 font-semibold"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(driver.id)}
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
            No drivers found
          </div>
        )}
      </div>
    </Layout>
  );
}
