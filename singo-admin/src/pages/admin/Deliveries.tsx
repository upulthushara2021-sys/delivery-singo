import { useEffect, useState } from "react";
import api from "../../api/axios";
import Layout from "../../components/Layout";
import { Search, Trash2, Printer, Filter, ChevronDown, Edit2 } from "lucide-react";

type Delivery = {
  id: number;
  trackingNumber: string;
  customerName: string;
  customerMobile: string;
  dropoffAddress: string;
  amount: number | string;
  deliveryCharge: number | string;
  status: string;
  paymentType: string;
  driver?: { id: number; name: string } | null;
  driverId?: number;
  company?: { id: number; name: string } | null;
  companyId?: number;
  createdAt?: string;
  assignments?: {
    id: number;
    driverId: number;
    assignmentType: "PICKUP" | "TRANSIT" | "CUSTOMER";
    assignedAt: string;
    driver?: { id: number; name: string };
  }[];
};

type AssignmentType = "PICKUP" | "TRANSIT" | "CUSTOMER";

type Driver = {
  id: number;
  name: string;
  email: string;
};

type Company = {
  id: number;
  name: string;
  email: string;
};

type CompanyGroup = {
  name: string;
  deliveries: Delivery[];
};

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (typeof value === "object" && "toNumber" in value) return value.toNumber();
  return 0;
};

// Helper function to format currency
const formatCurrency = (value: any): string => {
  return `Rs.${toNumber(value).toFixed(2)}`;
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"all" | "trackingNumber">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);

  useEffect(() => {
    loadDeliveries();
    loadDrivers();
    loadCompanies();
  }, [page, search, searchType, selectedCompany, filterStatus]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      let query = `/admin/deliveries?page=${page}`;

      if (search && searchType === "trackingNumber") {
        query += `&trackingNumber=${search}`;
      } else if (search) {
        query += `&search=${search}`;
      }

      const res = await api.get(query);
      console.log("Deliveries response:", res.data);

      const { data = [], pages = 1 } = res.data || {};

      let cleanDeliveries: Delivery[] = (data || [])
        .filter((d: any) => d && d.id)
        .map((d: any) => ({
          ...d,
          amount: toNumber(d.amount),
        }));

      if (selectedCompany) {
        cleanDeliveries = cleanDeliveries.filter(
          (d: Delivery) =>
            d.companyId === selectedCompany || d.company?.id === selectedCompany
        );
      }

      if (filterStatus) {
        cleanDeliveries = cleanDeliveries.filter(
          (d: Delivery) => d.status === filterStatus
        );
      }

      setDeliveries(cleanDeliveries);
      setTotalPages(pages);
    } catch (error) {
      console.error("Failed to load deliveries:", error);
      setDeliveries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await api.get("/admin/drivers");
      setDrivers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load drivers:", error);
      setDrivers([]);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.get("/admin/companies");
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load companies:", error);
      setCompanies([]);
    }
  };

  const assignDriver = async (
    deliveryId: number,
    driverId: number,
    assignmentType: AssignmentType = "PICKUP",
  ) => {
    if (!driverId) {
      alert("Please select a driver");
      return;
    }

    try {
      setAssigning(deliveryId);
      await api.post("/admin/assign-driver", {
        deliveryId,
        driverId,
        assignmentType,
      });
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      alert("✅ Driver assigned successfully!");
      loadDeliveries();
    } catch (error: any) {
      console.error("Assignment error:", error);
      alert(error.response?.data?.message || "Failed to assign driver");
    } finally {
      setAssigning(null);
    }
  };

  const updateDriver = async (
    deliveryId: number,
    newDriverId: number,
    assignmentType: AssignmentType,
  ) => {
    await assignDriver(deliveryId, newDriverId, assignmentType);
    setEditingDriverId(null);
  };

  const deleteDelivery = async (deliveryId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this delivery? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(deliveryId);
      await api.delete(`/admin/delivery/${deliveryId}`);
      alert("✅ Delivery deleted successfully!");
      loadDeliveries();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to delete delivery. Make sure it's not in a settlement."
      );
    } finally {
      setDeleting(null);
    }
  };

  const printDeliveryReceipt = (delivery: Delivery) => {
    const printContent = `
      <html>
        <head>
          <title>Delivery Receipt - ${delivery.trackingNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .tracking { font-size: 14px; color: #666; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .label { font-weight: bold; width: 40%; }
            .value { width: 60%; text-align: right; }
            .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; display: inline-block; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
            .separator { height: 1px; background-color: #ddd; margin: 20px 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📦 Delivery Receipt</div>
            <div class="tracking">Tracking #: ${delivery.trackingNumber}</div>
          </div>

          <div class="section">
            <div class="section-title">DELIVERY INFORMATION</div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value">${delivery.status}</span>
            </div>
            <div class="row">
              <span class="label">Payment Type:</span>
              <span class="value">${delivery.paymentType}</span>
            </div>
            <div class="row">
              <span class="label">Amount:</span>
              <span class="value">${formatCurrency(delivery.amount)}</span>
            </div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <div class="section-title">CUSTOMER DETAILS</div>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${delivery.customerName}</span>
            </div>
            <div class="row">
              <span class="label">Mobile:</span>
              <span class="value">${delivery.customerMobile}</span>
            </div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <div class="section-title">DELIVERY CHARGE</div>
            <div style="font-size: 13px; line-height: 1.6;">${delivery.deliveryCharge}</div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <div class="section-title">DROPOFF LOCATION</div>
            <div style="font-size: 13px; line-height: 1.6;">${delivery.dropoffAddress}</div>
          </div>

          ${
            delivery.driver
              ? `
            <div class="separator"></div>
            <div class="section">
              <div class="section-title">ASSIGNED DRIVER</div>
              <div class="row">
                <span class="label">Name:</span>
                <span class="value">${delivery.driver.name}</span>
              </div>
            </div>
          `
              : ""
          }

          <div class="separator"></div>

          <div class="footer">
            <p>Receipt Generated: ${new Date().toLocaleString()}</p>
            <p>Thank you for using our delivery service</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "PICKED_UP":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPaymentColor = (type: string): string => {
    return type === "COD"
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800";
  };

  const deliveriesByCompany = deliveries.reduce(
    (acc: Record<number, CompanyGroup>, delivery: Delivery) => {
      const companyId = delivery.companyId || delivery.company?.id || 0;
      const companyName =
        delivery.company?.name ||
        companies.find((c: Company) => c.id === companyId)?.name ||
        "Unknown";

      if (!acc[companyId]) {
        acc[companyId] = { name: companyName, deliveries: [] };
      }
      acc[companyId].deliveries.push(delivery);
      return acc;
    },
    {}
  );

  return (
    <Layout>
      <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Deliveries Management
      </h1>

      {/* Search & Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value as "all" | "trackingNumber");
                setSearch("");
                setPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              <option value="all">Search All Fields</option>
              <option value="trackingNumber">Tracking Number</option>
            </select>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={
                  searchType === "trackingNumber"
                    ? "Search by tracking number..."
                    : "Search by customer, mobile, address..."
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                className="absolute right-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Filters:
            </span>
          </div>

          <select
            value={selectedCompany || ""}
            onChange={(e) => {
              setSelectedCompany(e.target.value ? parseInt(e.target.value) : null);
              setPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          >
            <option value="">All Companies</option>
            {companies.map((company: Company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus || ""}
            onChange={(e) => {
              setFilterStatus(e.target.value || null);
              setPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {(selectedCompany || filterStatus || search) && (
            <button
              onClick={() => {
                setSelectedCompany(null);
                setFilterStatus(null);
                setSearch("");
                setPage(1);
              }}
              className="px-3 py-1 bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg text-sm hover:bg-gray-400 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {deliveries.length}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {deliveries.filter((d: Delivery) => d.status === "PENDING").length}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {
              deliveries.filter(
                (d: Delivery) =>
                  d.status === "ASSIGNED" || d.status === "PICKED_UP"
              ).length
            }
          </p>
        </div>
        <div className="bg-green-50 dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {deliveries.filter((d: Delivery) => d.status === "COMPLETED").length}
          </p>
        </div>
      </div>

      {/* Deliveries by Company */}
      {selectedCompany ? (
        <div className="space-y-6">
          {deliveriesByCompany[selectedCompany] ? (
            <CompanyDeliveriesTable
              companyId={selectedCompany}
              companyName={deliveriesByCompany[selectedCompany].name}
              deliveries={deliveriesByCompany[selectedCompany].deliveries}
              drivers={drivers}
              loading={loading}
              assigning={assigning}
              deleting={deleting}
              editingDriverId={editingDriverId}
              onAssign={assignDriver}
              onUpdate={updateDriver}
              onDelete={deleteDelivery}
              onPrint={printDeliveryReceipt}
              onEditDriver={setEditingDriverId}
              getStatusColor={getStatusColor}
              getPaymentColor={getPaymentColor}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No deliveries for selected company
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(deliveriesByCompany).map(
            ([companyId, company]: [string, CompanyGroup]) => (
              <CompanyDeliveriesTable
                key={companyId}
                companyId={parseInt(companyId)}
                companyName={company.name}
                deliveries={company.deliveries}
                drivers={drivers}
                loading={loading}
                assigning={assigning}
                deleting={deleting}
                editingDriverId={editingDriverId}
                onAssign={assignDriver}
                onUpdate={updateDriver}
                onDelete={deleteDelivery}
                onPrint={printDeliveryReceipt}
                onEditDriver={setEditingDriverId}
                getStatusColor={getStatusColor}
                getPaymentColor={getPaymentColor}
              />
            )
          )}

          {Object.keys(deliveriesByCompany).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                "No deliveries found"
              )}
            </div>
          )}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex gap-2 mt-8 items-center justify-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 font-semibold"
        >
          ← Previous
        </button>
        <span className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded font-semibold">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Next →
        </button>
      </div>
    </div>
    </Layout>
  );
}

interface CompanyDeliveriesTableProps {
  companyId: number;
  companyName: string;
  deliveries: Delivery[];
  drivers: Driver[];
  loading: boolean;
  assigning: number | null;
  deleting: number | null;
  editingDriverId: number | null;
  onAssign: (deliveryId: number, driverId: number, assignmentType?: AssignmentType) => void;
  onUpdate: (deliveryId: number, driverId: number, assignmentType: AssignmentType) => void;
  onDelete: (deliveryId: number) => void;
  onPrint: (delivery: Delivery) => void;
  onEditDriver: (deliveryId: number | null) => void;
  getStatusColor: (status: string) => string;
  getPaymentColor: (type: string) => string;
}

function CompanyDeliveriesTable({
  companyName,
  deliveries,
  drivers,
  loading,
  assigning,
  deleting,
  editingDriverId,
  onAssign,
  onUpdate,
  onDelete,
  onPrint,
  onEditDriver,
  getStatusColor,
  getPaymentColor,
}: CompanyDeliveriesTableProps) {
  const [expanded, setExpanded] = useState(true);

  const completedTotal = deliveries
    .filter((d: Delivery) => d.status === "COMPLETED")
    .reduce((sum: number, d: Delivery) => sum + toNumber(d.amount), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
      {/* Company Header */}
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ChevronDown
              size={20}
              className={`text-white transition ${
                expanded ? "rotate-0" : "-rotate-90"
              }`}
            />
            <div>
              <h3 className="text-lg font-bold text-white">{companyName}</h3>
              <p className="text-blue-100 text-sm">
                {deliveries.length} deliveries
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Completed Total</p>
            <p className="text-white font-bold text-lg">
              {formatCurrency(completedTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Tracking #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Mobile
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Driver
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length > 0 ? (
                deliveries.map((d: Delivery) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">
                      {d.trackingNumber || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">{d.customerName || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">{d.customerMobile || "N/A"}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getPaymentColor(
                          d.paymentType
                        )}`}
                      >
                        {d.paymentType || "COD"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          d.status
                        )}`}
                      >
                        {d.status || "PENDING"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingDriverId === d.id ? (
                        <select
                          defaultValue={d.driverId || ""}
                          className="border p-1 rounded text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select driver</option>
                          {drivers.map((driver: Driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name}
                            </option>
                          ))}
                        </select>
                      ) : d.driver ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {d.driver.name}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic text-xs">
                          Not assigned
                        </span>
                      )}
                      {d.assignments && d.assignments.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                          {d.assignments.map((assignment) => (
                            <div key={assignment.id}>
                              <span className="font-semibold">{assignment.assignmentType}</span>{" "}
                              {assignment.driver?.name || `Driver #${assignment.driverId}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-2">
                        {/* PENDING - Assign Driver */}
                        {d.status === "PENDING" && editingDriverId !== d.id && (
                          <div className="flex gap-1 items-center justify-center">
                            <select
                              id={`driver-select-${d.id}`}
                              defaultValue=""
                              className="border p-1 rounded text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select</option>
                              {drivers.map((driver: Driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.name.substring(0, 10)}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const select = document.getElementById(
                                  `driver-select-${d.id}`
                                ) as HTMLSelectElement | null;
                                if (select) {
                                  const driverId = parseInt(select.value);
                                  if (driverId) {
                                    onAssign(d.id, driverId);
                                  }
                                }
                              }}
                              disabled={assigning === d.id}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                              {assigning === d.id ? "..." : "Set"}
                            </button>
                          </div>
                        )}

                        {/* Every active delivery can be handed to another driver. */}
                        {d.status !== "PENDING" && d.status !== "COMPLETED" && d.status !== "RETURNED" && (
                          <>
                            {editingDriverId === d.id ? (
                              <div className="flex gap-1 items-center justify-center">
                                <select
                                  id={`update-driver-select-${d.id}`}
                                  defaultValue={d.driverId || ""}
                                  className="border p-1 rounded text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select driver</option>
                                  {drivers.map((driver: Driver) => (
                                    <option key={driver.id} value={driver.id}>
                                      {driver.name.substring(0, 10)}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  id={`assignment-type-select-${d.id}`}
                                  defaultValue={d.status === "PICKED_UP" ? "TRANSIT" : d.status === "BRANCH_RECEIVED" ? "CUSTOMER" : "PICKUP"}
                                  className="border p-1 rounded text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                  <option value="PICKUP">Pickup</option>
                                  <option value="TRANSIT">Transit</option>
                                  <option value="CUSTOMER">Customer</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const select = document.getElementById(
                                      `update-driver-select-${d.id}`
                                    ) as HTMLSelectElement | null;
                                    if (select) {
                                      const driverId = parseInt(select.value);
                                      const typeSelect = document.getElementById(
                                        `assignment-type-select-${d.id}`
                                      ) as HTMLSelectElement | null;
                                      if (driverId) {
                                        onUpdate(d.id, driverId, (typeSelect?.value || "PICKUP") as AssignmentType);
                                      }
                                    }
                                  }}
                                  disabled={assigning === d.id}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                                >
                                  {assigning === d.id ? "..." : "Save"}
                                </button>
                                <button
                                  onClick={() => onEditDriver(null)}
                                  className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => onEditDriver(d.id)}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                                  title="Change driver"
                                >
                                  <Edit2 size={12} />
                                  Change
                                </button>
                                <button
                                  onClick={() => onPrint(d)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                                  title="Print receipt"
                                >
                                  <Printer size={12} />
                                </button>
                                <button
                                  onClick={() => onDelete(d.id)}
                                  disabled={deleting === d.id}
                                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                                  title="Delete delivery"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* COMPLETED - Only Print and Delete */}
                        {d.status === "COMPLETED" && (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => onPrint(d)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                              title="Print receipt"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={() => onDelete(d.id)}
                              disabled={deleting === d.id}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
                              title="Delete delivery"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No deliveries for this company
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}