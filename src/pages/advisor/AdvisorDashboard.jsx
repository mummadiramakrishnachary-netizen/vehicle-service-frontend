
import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function AdvisorDashboard() {
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanics, setSelectedMechanics] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (err.response?.status === 401) {
      return "Session expired or invalid. Please log in again.";
    }

    if (err.response?.status === 403) {
      return "Access denied. Log in using your Service Advisor account.";
    }

    if (err.response?.status === 404) {
      return "API endpoint not found. Check the backend controller URL.";
    }

    return fallback;
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/bookings/all");
      const data = Array.isArray(response.data) ? response.data : [];
      setBookings(data);
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not load bookings.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMechanics = useCallback(async () => {
    try {
      // Correct URL from MechanicController:
      // @RequestMapping("/api/mechanic") + @GetMapping
      const response = await api.get("/api/mechanic");
      const data = Array.isArray(response.data) ? response.data : [];

      setMechanics(data);

      if (data.length === 0) {
        setError("No mechanics found. Check the mechanics table in MySQL.");
      }
    } catch (err) {
      setMechanics([]);
      setError(
        getErrorMessage(err, "Could not load mechanics.")
      );
    }
  }, []);

  const refreshDashboard = async () => {
    setMessage("");
    await Promise.all([loadBookings(), loadMechanics()]);
  };

  useEffect(() => {
    loadBookings();
    loadMechanics();
  }, [loadBookings, loadMechanics]);

  const assignMechanic = async (bookingId) => {
    const mechanicId = selectedMechanics[bookingId];

    if (!mechanicId) {
      setError("Please select a mechanic first.");
      setMessage("");
      return;
    }

    setAssigningId(bookingId);
    setError("");
    setMessage("");

    try {
      await api.put(
        `/api/bookings/${bookingId}/assign-mechanic/${mechanicId}`
      );

      setMessage(
        `Mechanic assigned successfully to Booking #${bookingId}.`
      );

      setSelectedMechanics((previous) => ({
        ...previous,
        [bookingId]: "",
      }));

      await Promise.all([loadBookings(), loadMechanics()]);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          `Could not assign a mechanic to Booking #${bookingId}.`
        )
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "30px auto",
        padding: 20,
      }}
    >
      <h1>Service Advisor Dashboard</h1>
      <p>Manage service bookings and assign mechanics to repair jobs.</p>

      <button onClick={refreshDashboard} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Bookings"}
      </button>

      {error && (
        <p
          role="alert"
          style={{ color: "red", marginTop: 16 }}
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          style={{ color: "green", marginTop: 16 }}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((booking) => {
          const vehicle = booking.vehicle || {};
          const customer = booking.customer || {};
          const assignedMechanic = booking.mechanic || null;
          const status = booking.status;

          const canAssign =
            status !== "COMPLETED" &&
            status !== "CANCELLED" &&
            !assignedMechanic;
          return (
            <section
              key={booking.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 18,
                marginTop: 18,
              }}
            >
              <h2>Booking #{booking.id}</h2>

              <p>
                <strong>Vehicle:</strong>{" "}
                {vehicle.make || vehicle.brand || ""}{" "}
                {vehicle.model || vehicle.vehicleModel || "Vehicle"}
              </p>

              <p>
                <strong>Registration:</strong>{" "}
                {vehicle.registrationNumber || "Not available"}
              </p>

              <p>
                <strong>Customer:</strong>{" "}
                {customer.name || "Not available"}
              </p>

              <p>
                <strong>Booking Date:</strong>{" "}
                {booking.bookingDate
                  ? new Date(booking.bookingDate).toLocaleString()
                  : "Not available"}
              </p>

              <p>
                <strong>Reported Problem:</strong>{" "}
                {booking.problemDescription || "Not provided"}
              </p>

              <p>
                <strong>Problems Found:</strong>{" "}
                {booking.problemsFound || "Not yet updated"}
              </p>

              <p>
                <strong>Status:</strong> {status}
              </p>

              <p>
                <strong>Estimated Cost:</strong>{" "}
                {booking.estimatedCost != null
                  ? `₹${booking.estimatedCost}`
                  : "Not estimated"}
              </p>

              <p>
                <strong>Assigned Mechanic:</strong>{" "}
                {assignedMechanic?.name || "Not assigned"}
              </p>

              {canAssign && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <select
                    aria-label={`Select mechanic for booking ${booking.id}`}
                    value={selectedMechanics[booking.id] || ""}
                    onChange={(event) =>
                      setSelectedMechanics((previous) => ({
                        ...previous,
                        [booking.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select mechanic</option>

                    {mechanics.map((mechanic) => (
                      <option
                        key={mechanic.id}
                        value={mechanic.id}
                      >
                        {mechanic.name} (ID: {mechanic.id})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => assignMechanic(booking.id)}
                    disabled={
                      assigningId === booking.id ||
                      mechanics.length === 0
                    }
                  >
                    {assigningId === booking.id
                      ? "Assigning..."
                      : "Assign Mechanic"}
                  </button>
                </div>
              )}
            </section>
          );
        })
      )}
    </main>
  );
}

export default AdvisorDashboard;