
import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function MechanicDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [forms, setForms] = useState({});

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/bookings/mechanic");
      const data = Array.isArray(response.data) ? response.data : [];

      setBookings(data);

      setForms((previous) => {
        const updated = { ...previous };

        data.forEach((booking) => {
          if (!updated[booking.id]) {
            updated[booking.id] = {
              problemsFound: booking.problemsFound || "",
              estimatedCost: booking.estimatedCost ?? "",
              status: booking.status || "CONFIRMED",
            };
          }
        });

        return updated;
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load assigned bookings. Please check your mechanic login."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleChange = (bookingId, field, value) => {
    setForms((previous) => ({
      ...previous,
      [bookingId]: {
        ...previous[bookingId],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (bookingId) => {
    const form = forms[bookingId];

    if (!form) return;

    if (
      form.estimatedCost !== "" &&
      (!Number.isFinite(Number(form.estimatedCost)) ||
        Number(form.estimatedCost) < 0)
    ) {
      setError("Estimated cost must be zero or greater.");
      return;
    }

    setSavingId(bookingId);
    setError("");
    setMessage("");

    try {
      await api.put(`/api/bookings/${bookingId}/update`, {
        status: form.status,
        problemsFound: form.problemsFound.trim(),
        estimatedCost:
          form.estimatedCost === "" ? null : Number(form.estimatedCost),
      });

      setMessage(`Booking #${bookingId} updated successfully.`);
      await fetchBookings();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Could not update booking #${bookingId}.`
      );
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleString();
  };

  const styles = {
    page: {
      maxWidth: "1100px",
      margin: "30px auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      color: "#1f2937",
    },
    heading: {
      marginBottom: "8px",
    },
    card: {
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "20px",
      background: "#ffffff",
    },
    label: {
      display: "block",
      fontWeight: "600",
      marginTop: "14px",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "10px",
      border: "1px solid #cbd5e1",
      borderRadius: "6px",
      fontSize: "15px",
    },
    button: {
      marginTop: "18px",
      padding: "11px 18px",
      border: "none",
      borderRadius: "6px",
      background: "#2563eb",
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: "600",
    },
    notice: {
      padding: "12px",
      borderRadius: "6px",
      marginTop: "15px",
    },
  };

  return (
    <main style={styles.page}>
      <h1 style={styles.heading}>Mechanic Dashboard</h1>
      <p>View assigned service jobs and update repair progress.</p>

      <button
        type="button"
        style={{ ...styles.button, marginTop: "8px" }}
        onClick={fetchBookings}
        disabled={loading}
      >
        {loading ? "Loading..." : "Refresh Bookings"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            ...styles.notice,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            ...styles.notice,
            background: "#dcfce7",
            color: "#166534",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading assigned bookings...</p>
      ) : bookings.length === 0 ? (
        <div style={styles.card}>
          <h3>No assigned bookings</h3>
          <p>
            No service jobs are currently assigned to your mechanic account.
          </p>
        </div>
      ) : (
        bookings.map((booking) => {
          const form = forms[booking.id] || {
            problemsFound: "",
            estimatedCost: "",
            status: booking.status || "CONFIRMED",
          };

          const isCompleted = booking.status === "COMPLETED";
          const isCancelled = booking.status === "CANCELLED";

          return (
            <section key={booking.id} style={styles.card}>
              <h2>Booking #{booking.id}</h2>

              <p>
                <strong>Vehicle:</strong>{" "}
                {booking.vehicle
                  ? `${booking.vehicle.brand || ""} ${
                      booking.vehicle.model || ""
                    }`.trim()
                  : "Vehicle details unavailable"}
              </p>

              <p>
                <strong>Registration:</strong>{" "}
                {booking.vehicle?.registrationNumber || "Not available"}
              </p>

              <p>
                <strong>Customer:</strong>{" "}
                {booking.customer?.name || "Not available"}
              </p>

              <p>
                <strong>Booking Date:</strong>{" "}
                {formatDate(booking.bookingDate)}
              </p>

              <p>
                <strong>Reported Problem:</strong>{" "}
                {booking.problemDescription || "Not provided"}
              </p>

              <p>
                <strong>Current Status:</strong> {booking.status}
              </p>

              <p>
                <strong>Current Estimated Cost:</strong>{" "}
                {booking.estimatedCost == null
                  ? "Not estimated"
                  : `₹${booking.estimatedCost}`}
              </p>

              <label style={styles.label} htmlFor={`problems-${booking.id}`}>
                Problems Found
              </label>
              <textarea
                id={`problems-${booking.id}`}
                rows={4}
                maxLength={1000}
                style={styles.input}
                value={form.problemsFound}
                disabled={isCompleted || isCancelled}
                placeholder="Enter inspection findings and repair requirements"
                onChange={(event) =>
                  handleChange(
                    booking.id,
                    "problemsFound",
                    event.target.value
                  )
                }
              />

              <label style={styles.label} htmlFor={`cost-${booking.id}`}>
                Estimated Repair Cost (₹)
              </label>
              <input
                id={`cost-${booking.id}`}
                type="number"
                min="0"
                step="0.01"
                style={styles.input}
                value={form.estimatedCost}
                disabled={isCompleted || isCancelled}
                placeholder="Enter estimated cost"
                onChange={(event) =>
                  handleChange(
                    booking.id,
                    "estimatedCost",
                    event.target.value
                  )
                }
              />

              <label style={styles.label} htmlFor={`status-${booking.id}`}>
                Update Status
              </label>
              <select
                id={`status-${booking.id}`}
                style={styles.input}
                value={form.status}
                disabled={isCompleted || isCancelled}
                onChange={(event) =>
                  handleChange(booking.id, "status", event.target.value)
                }
              >
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="WAITING_FOR_PARTS">WAITING_FOR_PARTS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              {!isCompleted && !isCancelled && (
                <button
                  type="button"
                  style={styles.button}
                  disabled={savingId === booking.id}
                  onClick={() => handleUpdate(booking.id)}
                >
                  {savingId === booking.id
                    ? "Saving..."
                    : "Save Service Update"}
                </button>
              )}
            </section>
          );
        })
      )}
    </main>
  );
}

export default MechanicDashboard;
