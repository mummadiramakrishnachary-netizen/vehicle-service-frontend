
import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

   
const results = await Promise.allSettled([
  api.get("/api/bookings/all"),
  api.get("/api/admin/mechanics"),
]);


    if (results[0].status === "fulfilled") {
      const data = results[0].value.data;
      setBookings(Array.isArray(data) ? data : []);
    } else {
      setBookings([]);
      setError(
        results[0].reason.response?.data?.message ||
          "Could not load bookings. Check your ADMIN login."
      );
    }

    if (results[1].status === "fulfilled") {
      const data = results[1].value.data;
      setMechanics(Array.isArray(data) ? data : []);
    } else {
      setMechanics([]);
      setError((previous) =>
        previous ||
        results[1].reason.response?.data?.message ||
        "Could not load mechanics."
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createMechanic = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setCreating(true);

    try {
      await api.post("/api/admin/mechanics", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      setMessage("Mechanic account created successfully.");

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      await loadDashboard();
    } catch (err) {
      const responseData = err.response?.data;

      setError(
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
              (err.response?.status === 409
                ? "This email is already registered."
                : err.response?.status === 403
                  ? "Access denied. Please log in with an ADMIN account."
                  : "Could not create mechanic account.")
      );
    } finally {
      setCreating(false);
    }
  };

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(
    (booking) => booking.status === "COMPLETED"
  ).length;
  const activeBookings = bookings.filter(
    (booking) =>
      !["COMPLETED", "CANCELLED"].includes(booking.status)
  ).length;

  const availableMechanics = mechanics.filter(
    (mechanic) => mechanic.available === true
  ).length;

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 18,
    minWidth: 140,
    flex: "1 1 140px",
  };

  return (
    <main
      style={{
        maxWidth: 1150,
        margin: "30px auto",
        padding: 20,
      }}
    >
      <h1>Admin Dashboard</h1>
      <p>Manage workshop staff and monitor service operations.</p>

      <button onClick={loadDashboard} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Dashboard"}
      </button>

      {error && (
        <p role="alert" style={{ color: "red", marginTop: 16 }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: "green", marginTop: 16 }}>
          {message}
        </p>
      )}

      <h2>Overview</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          marginTop: 16,
        }}
      >
        <div style={cardStyle}>
          <p>Total Bookings</p>
          <h2>{loading ? "..." : totalBookings}</h2>
        </div>

        <div style={cardStyle}>
          <p>Completed Jobs</p>
          <h2>{loading ? "..." : completedBookings}</h2>
        </div>

        <div style={cardStyle}>
          <p>Active Jobs</p>
          <h2>{loading ? "..." : activeBookings}</h2>
        </div>

        <div style={cardStyle}>
          <p>Total Mechanics</p>
          <h2>{loading ? "..." : mechanics.length}</h2>
        </div>

        <div style={cardStyle}>
          <p>Available Mechanics</p>
          <h2>{loading ? "..." : availableMechanics}</h2>
        </div>
      </div>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 20,
          marginTop: 28,
        }}
      >
        <h2>Create Mechanic Account</h2>
        <p>
          Create a mechanic login and profile for your workshop.
        </p>

        <form
          onSubmit={createMechanic}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Mechanic full name"
            aria-label="Mechanic full name"
            required
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
            aria-label="Mechanic email"
            required
          />

          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
            aria-label="Mechanic phone number"
            required
          />

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Temporary password"
            aria-label="Mechanic password"
            minLength={6}
            required
          />

          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Mechanic"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Mechanics</h2>

        {loading ? (
          <p>Loading mechanics...</p>
        ) : mechanics.length === 0 ? (
          <p>No mechanics found.</p>
        ) : (
          mechanics.map((mechanic) => (
            <article
              key={mechanic.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                marginTop: 12,
              }}
            >
              <h3>{mechanic.name}</h3>
              <p>
                <strong>Mechanic ID:</strong> {mechanic.id}
              </p>
              <p>
                <strong>Email:</strong> {mechanic.email}
              </p>
              <p>
                <strong>Phone:</strong> {mechanic.phone || "Not provided"}
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {mechanic.available ? "Available" : "Currently assigned"}
              </p>
            </article>
          ))
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>All Service Bookings</h2>

        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          bookings.map((booking) => (
            <article
              key={booking.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                marginTop: 12,
              }}
            >
              <h3>Booking #{booking.id}</h3>
              <p>
                <strong>Customer:</strong>{" "}
                {booking.customer?.name || "Not available"}
              </p>
              <p>
                <strong>Vehicle:</strong>{" "}
                {booking.vehicle?.make || booking.vehicle?.brand || ""}{" "}
                {booking.vehicle?.model ||
                  booking.vehicle?.vehicleModel ||
                  "Vehicle"}
              </p>
              <p>
                <strong>Status:</strong> {booking.status}
              </p>
              <p>
                <strong>Assigned Mechanic:</strong>{" "}
                {booking.mechanic?.name || "Not assigned"}
              </p>
              <p>
                <strong>Estimated Cost:</strong>{" "}
                {booking.estimatedCost != null
                  ? `₹${booking.estimatedCost}`
                  : "Not estimated"}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;