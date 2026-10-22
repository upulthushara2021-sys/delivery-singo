import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { MapPin, Loader2, Search } from "lucide-react";

interface TrackedDelivery {
  id: number;
  trackingNumber: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDistrict?: string;
  pickupBranch?: string;
  currentDistrict?: string;
  currentBranch?: string;
  dropoffDistrict?: string;
  dropoffBranch?: string;
  status: string;
  driver?: {
    id: number;
    name: string;
  };
  assignments?: {
    id: number;
    assignmentType: "PICKUP" | "TRANSIT" | "CUSTOMER";
    assignedAt: string;
    driver?: { id: number; name: string };
  }[];
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export default function AdminTracking() {
  const [deliveries, setDeliveries] = useState<TrackedDelivery[]>([]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<TrackedDelivery | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string; district: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [arrivalLoading, setArrivalLoading] = useState(false);

  useEffect(() => {
    api.get("/branches").then((res) => setBranches(res.data || [])).catch(console.error);
  }, []);

  const receiveAtBranch = async (
    event?: React.FormEvent<HTMLFormElement>,
    deliveryNumber = selectedDelivery?.trackingNumber || trackingNumber.trim(),
  ) => {
    event?.preventDefault();
    if (!deliveryNumber || !branchId) return;

    try {
      setArrivalLoading(true);
      await api.patch(`/tracking/by-number/${deliveryNumber}/branch`, {
        branchId: Number(branchId),
      });
      alert("Delivery received at branch");
      const res = await api.get(`/tracking/by-number/${deliveryNumber}`);
      setSelectedDelivery(res.data);
      setBranchId("");
      setTrackingNumber(deliveryNumber);
      loadDeliveries();
    } catch (error: any) {
      alert(error.response?.data?.message || "Could not receive delivery");
    } finally {
      setArrivalLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/deliveries?page=1");
      const data = res.data.data || [];
      // Filter only ASSIGNED and PICKED_UP deliveries
      const activeDeliveries = data.filter(
        (d: any) =>
          d.status === "ASSIGNED" ||
          d.status === "PICKED_UP" ||
          d.status === "BRANCH_RECEIVED"
      );
      setDeliveries(activeDeliveries);
    } catch (error) {
      console.error("Failed to load deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchDelivery = async () => {
    if (!trackingNumber.trim()) {
      alert("Please enter tracking number");
      return;
    }

    try {
      setSearchLoading(true);
      const res = await api.get(`/tracking/by-number/${trackingNumber}`);
      setSelectedDelivery(res.data);
    } catch (error: any) {
      alert(error.response?.data?.message || "Delivery not found");
    } finally {
      setSearchLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "PICKED_UP":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Real-Time Delivery Tracking
          </h1>
          <button
            onClick={loadDeliveries}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <form
          onSubmit={(event) => receiveAtBranch(event, trackingNumber.trim())}
          className="bg-amber-50 dark:bg-slate-900 p-6 rounded-lg shadow border border-amber-200 dark:border-amber-600"
        >
          <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-white">
            Receive delivery at branch
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter the tracking number when the delivery arrives. The company and admin tracking views will update automatically.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking number"
              required
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
            />
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select receiving branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.district})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={arrivalLoading || !branches.length}
              className="bg-amber-600 text-white px-5 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {arrivalLoading ? "Updating..." : "Update location"}
            </button>
          </div>
        </form>

        {/* Search Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Search by Tracking Number
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchDelivery()}
              placeholder="Enter tracking number..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={searchDelivery}
              disabled={searchLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {searchLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Search
            </button>
          </div>
        </div>

        {/* Active Deliveries List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Active Deliveries (In Transit)
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  onClick={() => setSelectedDelivery(delivery)}
                  className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {delivery.trackingNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {delivery.customerName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(delivery.status)}`}>
                      {delivery.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Pickup</p>
                      <p className="text-gray-800 dark:text-white truncate">
                        {(delivery.pickupAddress || delivery.pickupBranch || delivery.pickupDistrict || "Not recorded").substring(0, 30)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Dropoff</p>
                      <p className="text-gray-800 dark:text-white truncate">
                        {delivery.dropoffAddress.substring(0, 30)}...
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                    Current branch: {delivery.currentBranch || delivery.currentDistrict || "Not checked in"}
                  </p>

                  {delivery.driver && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        Driver: <span className="font-semibold">{delivery.driver.name}</span>
                      </p>
                    </div>
                  )}

                  {delivery.currentLocation && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <MapPin size={14} />
                      <span>
                        Lat: {delivery.currentLocation.latitude.toFixed(4)}, Lng:{" "}
                        {delivery.currentLocation.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No active deliveries</p>
          )}
        </div>

        {/* Selected Delivery Details */}
        {selectedDelivery && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border-2 border-blue-200 dark:border-blue-600">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Tracking Details
              </h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Info */}
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-600">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-semibold mb-2">Current Branch</p>
                  <p className="font-bold text-gray-800 dark:text-white">
                    {selectedDelivery.currentBranch || selectedDelivery.currentDistrict || "Not checked in"}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="flex-1 px-3 py-2 border rounded dark:bg-slate-700 dark:text-white">
                      <option value="">Select receiving branch</option>
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.district})</option>)}
                    </select>
                    <button onClick={() => receiveAtBranch()} disabled={!branchId || arrivalLoading} className="bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">Receive</button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Number</p>
                  <p className="font-mono font-bold text-gray-800 dark:text-white">
                    {selectedDelivery.trackingNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedDelivery.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                      selectedDelivery.status
                    )}`}
                  >
                    {selectedDelivery.status}
                  </span>
                </div>

                {selectedDelivery.driver && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Driver</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedDelivery.driver.name}
                    </p>
                  </div>
                )}

                {selectedDelivery.assignments && selectedDelivery.assignments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Driver history</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-800 dark:text-white">
                      {selectedDelivery.assignments.map((assignment) => (
                        <p key={assignment.id}>
                          <span className="font-semibold">{assignment.assignmentType}</span>{" "}
                          {assignment.driver?.name || "Driver"} - {new Date(assignment.assignedAt).toLocaleString()}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location & Address Info */}
              <div className="space-y-4">
                {selectedDelivery.currentLocation && (
                  <div className="p-4 bg-green-50 dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-600">
                    <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-2">
                      Current Location
                    </p>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600 dark:text-gray-400">Latitude:</span>{" "}
                        <span className="font-mono">
                          {selectedDelivery.currentLocation.latitude.toFixed(6)}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600 dark:text-gray-400">Longitude:</span>{" "}
                        <span className="font-mono">
                          {selectedDelivery.currentLocation.longitude.toFixed(6)}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600 dark:text-gray-400">Last Update:</span>{" "}
                        <span className="text-xs">
                          {new Date(selectedDelivery.currentLocation.timestamp).toLocaleTimeString()}
                        </span>
                      </p>
                    </div>

                    {/* Google Maps Link */}
                    <a
                      href={`https://www.google.com/maps?q=${selectedDelivery.currentLocation.latitude},${selectedDelivery.currentLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-semibold"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pickup Address</p>
                  <p className="text-gray-800 dark:text-white text-sm">
                    {selectedDelivery.pickupAddress}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dropoff Address</p>
                  <p className="text-gray-800 dark:text-white text-sm">
                    {selectedDelivery.dropoffAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}