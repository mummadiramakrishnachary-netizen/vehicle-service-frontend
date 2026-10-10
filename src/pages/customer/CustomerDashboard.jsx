import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

const currentYear = new Date().getFullYear();

const initialVehicleForm = {
  registrationNumber: "",
  brand: "",
  model: "",
  manufacturingYear: currentYear,
  fuelType: "PETROL",
};

const initialBookingForm = {
  vehicleId: "",
  bookingDate: "",
  problemDescription: "",
};

function CustomerDashboard() {
  const { user, logout } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const [selectedProgress, setSelectedProgress] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchVehicles = useCallback(async () => {
    const response = await api.get("/api/vehicles");
    setVehicles(Array.isArray(response.data) ? response.data : []);
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);

    try {
      const response = await api.get("/api/bookings");
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load bookings. Please try again."
      );
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      const response = await api.get("/api/notifications");
      const data = response.data || {};

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : []
      );
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);
  
  // Automatically refresh notifications every 20 seconds.
  useEffect(() => {
    const notificationTimer = setInterval(() => {
      fetchNotifications();
    }, 20000);

    return () => {
      clearInterval(notificationTimer);
    };
  }, [fetchNotifications]);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        fetchVehicles(),
        fetchBookings(),
        fetchNotifications(),
      ]);
    } catch (err) {
      console.error("Failed to load dashboard:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Please log in again and retry.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard information."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fetchVehicles, fetchBookings, fetchNotifications]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const handleMarkAsRead = async (notification) => {
    setError("");

    try {
      setMarkingNotificationId(notification.id);

      await api.put(`/api/notifications/${notification.id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError(
        err.response?.data?.message ||
          "Could not mark this notification as read."
      );
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setError("");

    try {
      setMarkingAllRead(true);

      await api.put("/api/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setError(
        err.response?.data?.message ||
          "Could not mark notifications as read."
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleVehicleChange = (event) => {
    const { name, value } = event.target;

    setVehicleForm((previous) => ({
      ...previous,
      [name]:
        name === "manufacturingYear" && value !== ""
          ? Number(value)
          : value,
    }));
  };

  const resetVehicleForm = () => {
    setVehicleForm(initialVehicleForm);
    setEditingVehicleId(null);
    setShowVehicleForm(false);
  };

  const handleEditVehicle = (vehicle) => {
    setError("");
    setSuccess("");

    setVehicleForm({
      registrationNumber: vehicle.registrationNumber || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      manufacturingYear: vehicle.manufacturingYear || currentYear,
      fuelType: vehicle.fuelType || "PETROL",
    });

    setEditingVehicleId(vehicle.id);
    setShowVehicleForm(true);
  };

  const handleSaveVehicle = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !vehicleForm.registrationNumber.trim() ||
      !vehicleForm.brand.trim() ||
      !vehicleForm.model.trim()
    ) {
      setError("Please fill in all vehicle fields.");
      return;
    }

    if (
      !Number.isInteger(Number(vehicleForm.manufacturingYear)) ||
      Number(vehicleForm.manufacturingYear) < 1900 ||
      Number(vehicleForm.manufacturingYear) > currentYear
    ) {
      setError(`Enter a valid manufacturing year (1900–${currentYear}).`);
      return;
    }

    const payload = {
      registrationNumber: vehicleForm.registrationNumber.trim().toUpperCase(),
      brand: vehicleForm.brand.trim(),
      model: vehicleForm.model.trim(),
      manufacturingYear: Number(vehicleForm.manufacturingYear),
      fuelType: vehicleForm.fuelType,
    };

    const isEditing = editingVehicleId !== null;

    try {
      setSavingVehicle(true);

      if (isEditing) {
        await api.put(`/api/vehicles/${editingVehicleId}`, payload);
      } else {
        await api.post("/api/vehicles", payload);
      }

      resetVehicleForm();
      setSuccess(
        isEditing
          ? "Vehicle updated successfully!"
          : "Vehicle registered successfully!"
      );

      await fetchVehicles();
    } catch (err) {
      console.error("Failed to save vehicle:", err);
      setError(
        err.response?.data?.message ||
          "Could not save the vehicle. Please check the details."
      );
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    if (
      !window.confirm(
        `Delete ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setDeletingVehicleId(vehicle.id);
      await api.delete(`/api/vehicles/${vehicle.id}`);

      if (String(bookingForm.vehicleId) === String(vehicle.id)) {
        setBookingForm((previous) => ({ ...previous, vehicleId: "" }));
      }

      if (editingVehicleId === vehicle.id) {
        resetVehicleForm();
      }

      setSuccess("Vehicle deleted successfully!");
      await fetchVehicles();
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
      setError(
        err.response?.data?.message ||
          "Could not delete the vehicle. It may be linked to a service booking."
      );
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;

    setBookingForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!bookingForm.vehicleId) {
      setError("Please select a vehicle.");
      return;
    }

    if (!bookingForm.bookingDate || !bookingForm.problemDescription.trim()) {
      setError("Please enter a booking date and describe the problem.");
      return;
    }

    if (new Date(bookingForm.bookingDate).getTime() <= Date.now()) {
      setError("Choose a booking date and time in the future.");
      return;
    }

    if (bookingForm.problemDescription.trim().length > 1000) {
      setError("Problem description cannot exceed 1000 characters.");
      return;
    }

    const payload = {
      vehicleId: Number(bookingForm.vehicleId),
      bookingDate: bookingForm.bookingDate,
      problemDescription: bookingForm.problemDescription.trim(),
    };

    try {
      setSubmittingBooking(true);

      await api.post("/api/bookings", payload);

      setBookingForm(initialBookingForm);
      setShowBookingForm(false);
      setSuccess("Service booking created successfully!");

      await fetchBookings();
    } catch (err) {
      console.error("Failed to create booking:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Only customers can create service bookings.");
      } else {
        setError(
          err.response?.data?.message ||
            "Could not create booking. Check the details and try again."
        );
      }
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleViewProgress = async (booking) => {
    setError("");
    setSuccess("");
    setHistoryLoading(true);
    setSelectedProgress(null);
    setBookingHistory([]);

    try {
      const response = await api.get(`/api/bookings/${booking.id}/progress`);
      setSelectedProgress(response.data);

      try {
        const historyResponse = await api.get(
          `/api/bookings/${booking.id}/history`
        );

        setBookingHistory(
          Array.isArray(historyResponse.data) ? historyResponse.data : []
        );
      } catch (historyError) {
        console.error("Could not load booking history:", historyError);
      }
    } catch (err) {
      console.error("Could not load booking progress:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load booking progress."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm(`Cancel service booking #${booking.id}?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setCancellingBookingId(booking.id);

      await api.put(`/api/bookings/${booking.id}/cancel`);

      setSuccess(`Booking #${booking.id} cancelled successfully!`);

      if (selectedProgress?.id === booking.id) {
        setSelectedProgress(null);
        setBookingHistory([]);
      }

      await Promise.all([fetchBookings(), fetchNotifications()]);
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      setError(
        err.response?.data?.message ||
          "Could not cancel this booking. It may already be completed or cancelled."
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  const getVehicleName = (vehicle) =>
    vehicle
      ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
      : "Vehicle";

  const getStatusStyle = (status) => ({
    ...styles.status,
    ...(status === "COMPLETED"
      ? styles.completedStatus
      : status === "CANCELLED"
        ? styles.cancelledStatus
        : styles.activeStatus),
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Customer Dashboard</h1>
        <button style={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </header>

      <section style={styles.card}>
        <h2>Welcome, {user?.name || "Customer"}!</h2>
        <p>You are logged in to Vehicle Service Management.</p>
        <p><strong>Name:</strong> {user?.name || "Not available"}</p>
        <p><strong>Email:</strong> {user?.email || "Not available"}</p>
        <p><strong>Role:</strong> {user?.role || "Not available"}</p>
      </section>

      {success && <p style={styles.success}>{success}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* NOTIFICATIONS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2>
              Notifications{" "}
              <span style={styles.unreadBadge}>{unreadCount} unread</span>
            </h2>
            <p>Updates about your mechanic, repairs, and estimated costs.</p>
          </div>

          <div style={styles.actions}>
            <button
              style={styles.secondaryButton}
              onClick={fetchNotifications}
              disabled={notificationsLoading}
            >
              {notificationsLoading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              style={styles.primaryButton}
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead || unreadCount === 0}
            >
              {markingAllRead ? "Updating..." : "Mark All as Read"}
            </button>
          </div>
        </div>

        {notificationsLoading && <p>Loading notifications...</p>}

        {!notificationsLoading && notifications.length === 0 && (
          <p>No notifications yet. Updates will appear here when your service progresses.</p>
        )}

        <div style={styles.notificationList}>
          {notifications.map((notification) => (
            <article
              key={notification.id}
              style={{
                ...styles.notificationCard,
                ...(notification.read ? {} : styles.unreadNotification),
              }}
            >
              <div style={styles.notificationHeader}>
                <strong>
                  {notification.read ? "Notification" : "New notification"}
                </strong>

                {!notification.read && (
                  <span style={styles.unreadDot}>UNREAD</span>
                )}
              </div>

              <p>{notification.message}</p>

              <p style={styles.notificationDate}>
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleString()
                  : "Date not available"}
              </p>

              <div style={styles.actions}>
                {notification.bookingId > 0 && (
                  <button
                    style={styles.secondaryButton}
                    onClick={() => {
                      const booking = bookings.find(
                        (item) => item.id === notification.bookingId
                      );

                      if (booking) {
                        handleViewProgress(booking);
                        document.getElementById("my-bookings")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      } else {
                        setError(
                          "The related booking was not found in your current booking list."
                        );
                      }
                    }}
                  >
                    View Booking
                  </button>
                )}

                {!notification.read && (
                  <button
                    style={styles.primaryButton}
                    onClick={() => handleMarkAsRead(notification)}
                    disabled={markingNotificationId === notification.id}
                  >
                    {markingNotificationId === notification.id
                      ? "Updating..."
                      : "Mark as Read"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* VEHICLES */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2>My Vehicles</h2>
            <span style={styles.count}>{vehicles.length} vehicle(s)</span>
          </div>

          <button
            style={styles.primaryButton}
            onClick={() => {
              setError("");
              setSuccess("");

              if (showVehicleForm && editingVehicleId === null) {
                resetVehicleForm();
              } else {
                setVehicleForm(initialVehicleForm);
                setEditingVehicleId(null);
                setShowVehicleForm(true);
              }
            }}
          >
            {showVehicleForm && editingVehicleId === null
              ? "Close Form"
              : "+ Add Vehicle"}
          </button>
        </div>

        {showVehicleForm && (
          <form style={styles.form} onSubmit={handleSaveVehicle}>
            <h3>{editingVehicleId !== null ? "Edit Vehicle" : "Register a Vehicle"}</h3>

            <label style={styles.label} htmlFor="registrationNumber">Registration Number</label>
            <input
              id="registrationNumber"
              name="registrationNumber"
              value={vehicleForm.registrationNumber}
              onChange={handleVehicleChange}
              placeholder="e.g. TS09XY9876"
              maxLength={20}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="brand">Brand</label>
            <input
              id="brand"
              name="brand"
              value={vehicleForm.brand}
              onChange={handleVehicleChange}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="model">Model</label>
            <input
              id="model"
              name="model"
              value={vehicleForm.model}
              onChange={handleVehicleChange}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="manufacturingYear">Manufacturing Year</label>
            <input
              id="manufacturingYear"
              name="manufacturingYear"
              type="number"
              min="1900"
              max={currentYear}
              value={vehicleForm.manufacturingYear}
              onChange={handleVehicleChange}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="fuelType">Fuel Type</label>
            <select
              id="fuelType"
              name="fuelType"
              value={vehicleForm.fuelType}
              onChange={handleVehicleChange}
              style={styles.input}
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
            </select>

            <div style={styles.actions}>
              <button type="submit" style={styles.primaryButton} disabled={savingVehicle}>
                {savingVehicle ? "Saving..." : editingVehicleId !== null ? "Save Changes" : "Register Vehicle"}
              </button>
              <button type="button" style={styles.secondaryButton} onClick={resetVehicleForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && <p>Loading dashboard...</p>}

        {!loading && vehicles.length === 0 && (
          <p>No vehicles registered yet. Add a vehicle before booking a service.</p>
        )}

        <div style={styles.grid}>
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} style={styles.vehicleCard}>
              <h3>{getVehicleName(vehicle)}</h3>
              <p><strong>Registration:</strong> {vehicle.registrationNumber}</p>
              <p><strong>Fuel Type:</strong> {vehicle.fuelType}</p>
              <p><strong>Manufacturing Year:</strong> {vehicle.manufacturingYear}</p>

              <div style={styles.actions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => handleEditVehicle(vehicle)}
                  disabled={savingVehicle || deletingVehicleId !== null}
                >
                  Edit
                </button>
                <button
                  style={styles.dangerButton}
                  onClick={() => handleDeleteVehicle(vehicle)}
                  disabled={savingVehicle || deletingVehicleId !== null}
                >
                  {deletingVehicleId === vehicle.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CREATE BOOKING */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2>Book a Service</h2>
            <p>Schedule a repair or maintenance appointment.</p>
          </div>

          <button
            style={styles.primaryButton}
            disabled={vehicles.length === 0}
            onClick={() => {
              setError("");
              setSuccess("");
              setShowBookingForm((previous) => !previous);
            }}
          >
            {showBookingForm ? "Close Form" : "+ Book Service"}
          </button>
        </div>

        {vehicles.length === 0 && (
          <p>Register a vehicle before booking a service.</p>
        )}

        {showBookingForm && vehicles.length > 0 && (
          <form style={styles.form} onSubmit={handleCreateBooking}>
            <h3>New Service Booking</h3>

            <label style={styles.label} htmlFor="vehicleId">Select Vehicle</label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={bookingForm.vehicleId}
              onChange={handleBookingChange}
              required
              style={styles.input}
            >
              <option value="">-- Choose your vehicle --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {getVehicleName(vehicle)} — {vehicle.registrationNumber}
                </option>
              ))}
            </select>

            <label style={styles.label} htmlFor="bookingDate">Booking Date and Time</label>
            <input
              id="bookingDate"
              name="bookingDate"
              type="datetime-local"
              value={bookingForm.bookingDate}
              onChange={handleBookingChange}
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)}
              required
              style={styles.input}
            />

            <label style={styles.label} htmlFor="problemDescription">Describe the Problem</label>
            <textarea
              id="problemDescription"
              name="problemDescription"
              value={bookingForm.problemDescription}
              onChange={handleBookingChange}
              placeholder="Describe the problem with your vehicle..."
              maxLength={1000}
              rows={5}
              required
              style={styles.input}
            />

            <p style={styles.helperText}>
              {bookingForm.problemDescription.length}/1000 characters
            </p>

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={submittingBooking}
            >
              {submittingBooking ? "Submitting..." : "Submit Booking"}
            </button>
          </form>
        )}
      </section>

      {/* CUSTOMER BOOKINGS AND PROGRESS */}
      <section style={styles.section} id="my-bookings">
        <h2>My Bookings</h2>

        {bookingsLoading && <p>Loading bookings...</p>}

        {!bookingsLoading && bookings.length === 0 && (
          <p>You haven't booked a service yet.</p>
        )}

        <div style={styles.grid}>
          {bookings.map((booking) => (
            <article key={booking.id} style={styles.bookingCard}>
              <h3>Booking #{booking.id}</h3>
              <p><strong>Vehicle:</strong> {getVehicleName(booking.vehicle)}</p>
              <p><strong>Registration:</strong> {booking.vehicle?.registrationNumber || "Not available"}</p>
              <p>
                <strong>Date:</strong>{" "}
                {booking.bookingDate
                  ? new Date(booking.bookingDate).toLocaleString()
                  : "Not available"}
              </p>
              <p><strong>Problem:</strong> {booking.problemDescription}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span style={getStatusStyle(booking.status)}>
                  {booking.status || "BOOKED"}
                </span>
              </p>
              <p><strong>Problems Found:</strong> {booking.problemsFound || "Not yet updated"}</p>
              <p>
                <strong>Estimated Cost:</strong>{" "}
                {booking.estimatedCost != null
                  ? `₹${booking.estimatedCost}`
                  : "Not yet estimated"}
              </p>
              <p><strong>Mechanic:</strong> {booking.mechanic?.name || "Not assigned yet"}</p>

              <div style={styles.actions}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => handleViewProgress(booking)}
                  disabled={historyLoading}
                >
                  View Progress
                </button>

                {!["COMPLETED", "CANCELLED"].includes(booking.status) && (
                  <button
                    style={styles.dangerButton}
                    onClick={() => handleCancelBooking(booking)}
                    disabled={cancellingBookingId !== null}
                  >
                    {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {selectedProgress && (
          <div style={styles.progressPanel}>
            <div style={styles.sectionHeader}>
              <h3>Progress for Booking #{selectedProgress.id}</h3>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  setSelectedProgress(null);
                  setBookingHistory([]);
                }}
              >
                Close
              </button>
            </div>

            <p><strong>Status:</strong> {selectedProgress.status}</p>
            <p><strong>Problems Found:</strong> {selectedProgress.problemsFound || "Not yet updated"}</p>
            <p>
              <strong>Estimated Cost:</strong>{" "}
              {selectedProgress.estimatedCost != null
                ? `₹${selectedProgress.estimatedCost}`
                : "Not yet estimated"}
            </p>

            <h4>Service Update History</h4>

            {bookingHistory.length === 0 ? (
              <p>No service updates have been recorded yet.</p>
            ) : (
              bookingHistory.map((item, index) => (
                <article key={item.id ?? index} style={styles.historyItem}>
                  <p><strong>Status:</strong> {item.status || "Update"}</p>
                  <p><strong>Problems Found:</strong> {item.problemsFound || "None recorded"}</p>
                  <p>
                    <strong>Estimated Cost:</strong>{" "}
                    {item.estimatedCost != null ? `₹${item.estimatedCost}` : "Not provided"}
                  </p>
                  <p>
                    <strong>Updated:</strong>{" "}
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleString()
                      : "Date not available"}
                  </p>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    backgroundColor: "#f3f6fb",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    color: "#172033",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    margin: "0 auto 28px",
    maxWidth: "1440px",
  },
  logoutButton: {
    padding: "11px 20px",
    backgroundColor: "#fff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
  },
  card: {
    background: "linear-gradient(135deg, #172554, #1d4ed8)",
    color: "#ffffff",
    padding: "30px",
    borderRadius: "20px",
    boxShadow: "0 12px 30px rgba(30, 64, 175, 0.16)",
    margin: "0 auto 26px",
    maxWidth: "1440px",
    overflowWrap: "anywhere",
  },
  section: {
    backgroundColor: "#ffffff",
    padding: "26px",
    border: "1px solid #e6ebf2",
    borderRadius: "18px",
    boxShadow: "0 5px 20px rgba(15, 23, 42, 0.035)",
    margin: "0 auto 24px",
    maxWidth: "1440px",
    scrollMarginTop: "20px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "22px",
  },
  count: {
    display: "inline-block",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "7px 12px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "600",
  },
  unreadBadge: {
    display: "inline-block",
    fontSize: "12px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "6px 10px",
    borderRadius: "20px",
    verticalAlign: "middle",
    fontWeight: "700",
  },
  primaryButton: {
    padding: "11px 17px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    borderRadius: "9px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  secondaryButton: {
    padding: "10px 15px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    fontWeight: "600",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "10px 15px",
    backgroundColor: "#fff1f2",
    color: "#be123c",
    border: "1px solid #ffe4e6",
    borderRadius: "9px",
    fontWeight: "600",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "620px",
    boxSizing: "border-box",
    margin: "20px 0 28px",
    padding: "24px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#334155",
    marginTop: "5px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    fontSize: "15px",
    backgroundColor: "#ffffff",
    color: "#172033",
    fontFamily: "inherit",
    outlineColor: "#2563eb",
  },
  helperText: {
    margin: "0",
    color: "#64748b",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    marginTop: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "18px",
    marginTop: "18px",
  },
  vehicleCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "22px",
    backgroundColor: "#ffffff",
    overflowWrap: "anywhere",
    boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
  },
  bookingCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "22px",
    backgroundColor: "#ffffff",
    overflowWrap: "anywhere",
    boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
  },
  status: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.3px",
  },
  completedStatus: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  cancelledStatus: {
    backgroundColor: "#ffe4e6",
    color: "#9f1239",
  },
  activeStatus: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  progressPanel: {
    marginTop: "26px",
    padding: "24px",
    backgroundColor: "#f8fafc",
    border: "1px solid #dbe3ef",
    borderRadius: "14px",
    overflowWrap: "anywhere",
  },
  historyItem: {
    marginTop: "12px",
    padding: "18px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },
  notificationList: {
    display: "grid",
    gap: "14px",
  },
  notificationCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "18px",
    backgroundColor: "#ffffff",
    overflowWrap: "anywhere",
  },
  unreadNotification: {
    borderLeft: "4px solid #2563eb",
    backgroundColor: "#f0f6ff",
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  unreadDot: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#1d4ed8",
    backgroundColor: "#dbeafe",
    padding: "5px 8px",
    borderRadius: "20px",
  },
  notificationDate: {
    color: "#64748b",
    fontSize: "13px",
  },
  success: {
    padding: "14px 16px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    margin: "0 auto 20px",
    maxWidth: "1440px",
  },
  error: {
    padding: "14px 16px",
    backgroundColor: "#fff1f2",
    color: "#9f1239",
    border: "1px solid #fecdd3",
    borderRadius: "10px",
    margin: "0 auto 20px",
    maxWidth: "1440px",
    overflowWrap: "anywhere",
  },
};
export default CustomerDashboard;