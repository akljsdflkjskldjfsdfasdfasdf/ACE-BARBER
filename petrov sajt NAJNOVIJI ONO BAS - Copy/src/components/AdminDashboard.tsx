import { useEffect, useState } from "react";
import { supabase, Appointment } from "../lib/supabase";
import { LogOut, Calendar, Trash2, CheckCircle } from "lucide-react";

const ADMIN_EMAILS = [
  "du@gmail.com",
  "durutovicsovljanski2006@gmail.com",
  "ns@gmail.com",
];

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "booked" | "completed">("all");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let channel: any = null;
    const init = async () => {
      setCheckingAdmin(true);
      setError("");
      try {
        const { data: userData, error: userErr } =
          await supabase.auth.getUser();
        if (userErr || !userData?.user) {
          setError("No user session found. Please login.");
          setCheckingAdmin(false);
          setLoading(false);
          return;
        }
        const user = userData.user;
        if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
          setError(
            "Access denied. Only authorized admin emails can access this dashboard."
          );
          setIsAdmin(false);
          setCheckingAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        setCheckingAdmin(false);
        setError("");
        await fetchAppointments();

        channel = supabase
          .channel("admin_appointments_changes")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "appointments" },
            () => {
              fetchAppointments();
            }
          )
          .subscribe();
      } catch (err: any) {
        setError("Unexpected error during init. Check console.");
        setCheckingAdmin(false);
        setLoading(false);
      }
    };
    init();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });
      if (error) {
        setError("Failed to load appointments.");
        setAppointments([]);
      } else if (data) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch {
      setError("Unexpected error fetching appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete appointment
  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert("Action not allowed. Admin only.");
      return;
    }
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      console.log("Deleting appointment with id:", id);
      const res = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .select();

      console.log("delete result:", res);

      if (res.error) {
        alert(`Delete failed: ${res.error.message}`);
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert("Unexpected error when deleting. Check console.");
      console.error(err);
    }
  };

  // Update appointment status (e.g. to completed)
  const handleStatusChange = async (id: string, status: string) => {
    if (!isAdmin) {
      alert("Action not allowed. Admin only.");
      return;
    }
    try {
      console.log(`Updating appointment id ${id} to status: ${status}`);
      const timestamp = new Date().toISOString();
      const res = await supabase
        .from("appointments")
        .update({ status, updated_at: timestamp })
        .eq("id", id)
        .select();

      console.log("update result:", res);

      if (res.error) {
        alert(`Update failed: ${res.error.message}`);
        return;
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status, updated_at: timestamp } : a
        )
      );
    } catch (err: any) {
      alert("Unexpected error when updating. Check console.");
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    onLogout();
  };

  // Apply status filter
  const filteredAppointments = appointments.filter((apt) => {
    if (filter === "all") return true;
    return apt.status === filter;
  });

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Access denied</h2>
          <p className="text-neutral-400 mb-6">
            {error || "You are not an admin."}
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-white text-black font-bold hover:bg-neutral-200 transition"
          >
            Go back / Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-neutral-800 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ADMIN DASHBOARD</h1>
            <p className="text-neutral-400 mt-1">Manage appointments</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-700"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-3 font-semibold transition-colors ${
              filter === "all"
                ? "bg-white text-black"
                : "bg-neutral-900 text-white border border-neutral-800"
            }`}
          >
            ALL ({appointments.length})
          </button>
          <button
            onClick={() => setFilter("booked")}
            className={`px-6 py-3 font-semibold transition-colors ${
              filter === "booked"
                ? "bg-white text-black"
                : "bg-neutral-900 text-white border border-neutral-800"
            }`}
          >
            BOOKED ({appointments.filter((a) => a.status === "booked").length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-6 py-3 font-semibold transition-colors ${
              filter === "completed"
                ? "bg-white text-black"
                : "bg-neutral-900 text-white border border-neutral-800"
            }`}
          >
            COMPLETED (
            {appointments.filter((a) => a.status === "completed").length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
            <p className="text-neutral-400 text-lg">No appointments found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-neutral-950 border border-neutral-800 p-6 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold">
                        {appointment.first_name} {appointment.last_name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold ${
                          appointment.status === "booked"
                            ? "bg-green-900 text-green-100"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-neutral-400">
                      <div>
                        <p className="text-xs uppercase tracking-wide mb-1">
                          Phone
                        </p>
                        <p className="text-white">{appointment.phone_number}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide mb-1">
                          Date
                        </p>
                        <p className="text-white">
                          {new Date(
                            appointment.appointment_date + "T00:00:00"
                          ).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide mb-1">
                          Time
                        </p>
                        <p className="text-white">
                          {appointment.appointment_time}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {appointment.status === "booked" && (
                      <button
                        onClick={() =>
                          handleStatusChange(appointment.id, "completed")
                        }
                        className="p-3 bg-green-900 hover:bg-green-800 transition-colors"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="p-3 bg-red-900 hover:bg-red-800 transition-colors"
                      title="Delete appointment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
