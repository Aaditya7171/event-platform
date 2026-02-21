import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("events");
  const [user, setUser] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/check`, {
        withCredentials: true
      });
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${API_URL}/auth/logout`, {
        withCredentials: true
      });
      setUser(null);
      setProfileOpen(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const fetchEvents = async () => {
    const res = await axios.get(`${API_URL}/events`, {
      withCredentials: true
    });
    setEvents(res.data);
  };

  const importEvent = async (id) => {
    await axios.post(`${API_URL}/import/${id}`, {}, {
      withCredentials: true
    });
    fetchEvents();
  };

  const handleLeadSubmit = async () => {
    if (!email) return alert("Enter email");

    try {
      await axios.post(`${API_URL}/lead`, {
        email,
        consent,
        eventId: selectedEvent.id
      });

      window.location.href = selectedEvent.originalUrl;

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const goToDashboard = async () => {
    try {
      await axios.get(`${API_URL}/auth/check`, {
        withCredentials: true
      });
      setView("dashboard");
    } catch {
      alert("Login required");
    }
  };

  const getStatusBadge = (status) => {
    const base = "text-xs px-2 py-1 rounded font-medium capitalize";

    switch (status) {
      case "new":
        return `${base} bg-green-100 text-green-700`;

      case "updated":
        return `${base} bg-yellow-100 text-yellow-700`;

      case "inactive":
        return `${base} bg-red-100 text-red-700`;

      case "imported":
        return `${base} bg-blue-100 text-blue-700`;

      default:
        return `${base} bg-gray-100 text-gray-700`;
    }
  };

  const filteredEvents = events.filter(event => {

    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase());

    const matchesCity =
      city === "All" || event.city === city;

    const eventDate = new Date(event.datetime);

    const matchesStart =
      !startDate || eventDate >= new Date(startDate);

    const matchesEnd =
      !endDate || eventDate <= new Date(endDate);

    return matchesSearch && matchesCity && matchesStart && matchesEnd;
  });

  const getInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sydney Events</h1>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView("events")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Events
          </button>

          <button
            onClick={goToDashboard}
            className="bg-white border px-4 py-2 rounded"
          >
            Dashboard
          </button>

          {!user ? (
            <a
              href={`${API_URL}/auth/google`}
              className="bg-black text-white px-4 py-2 rounded inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Login with Google
            </a>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 bg-white border px-3 py-2 rounded hover:bg-gray-50 transition"
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                    {getInitial(user.name)}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {user.name}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border z-20 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center gap-3">
                        {user.photo ? (
                          <img
                            src={user.photo}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">
                            {getInitial(user.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">

        <input
          placeholder="Search events..."
          className="border p-2 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="All">All Cities</option>
          <option value="Sydney">Sydney</option>
          <option value="Melbourne">Melbourne</option>
        </select>

        <input
          type="date"
          className="border p-2 rounded"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

      </div>

      {/* EVENTS VIEW */}
      {view === "events" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <h2 className="font-bold">{event.title}</h2>
                <span className={getStatusBadge(event.status)}>
                  {event.status}
                </span>
              </div>

              <p className="text-sm text-gray-500">
                {new Date(event.datetime).toLocaleString()}
              </p>

              <p className="text-sm">{event.source}</p>

              <button
                onClick={() => setSelectedEvent(event)}
                className="mt-3 inline-block bg-black text-white px-3 py-1 rounded"
              >
                GET TICKETS
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {view === "dashboard" && (
        <table className="w-full bg-white rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} className="border-t">
                <td className="p-3">{event.title}</td>

                <td className="p-3">
                  <span className={getStatusBadge(event.status)}>
                    {event.status}
                  </span>
                </td>

                <td className="p-3">
                  <button
                    onClick={() => importEvent(event.id)}
                    className="bg-black text-white px-3 py-1 rounded"
                  >
                    Import
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-3">
              {selectedEvent.title}
            </h2>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border p-2 mb-3 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="text-sm">
                I agree to receive updates
              </span>
            </label>

            <div className="flex justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500"
              >
                Cancel
              </button>

              <button
                onClick={handleLeadSubmit}
                className="bg-black text-white px-4 py-1 rounded"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;