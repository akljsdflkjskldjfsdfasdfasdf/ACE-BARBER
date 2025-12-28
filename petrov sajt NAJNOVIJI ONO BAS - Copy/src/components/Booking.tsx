import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Calendar as CalendarIcon,
  Clock,
  Scissors,
  Droplets,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

const allTimeSlots = [
  "11:00", "11:45", "12:30", "13:15", "14:00", "14:45",
  "15:30", "16:15", "17:00", "17:45", "18:30", "19:15",
];

export default function Booking() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [tempTime, setTempTime] = useState("");
  
  // ZAŠTITA: Honeypot polje (nevidljivo za ljude)
  const [website, setWebsite] = useState("");

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hasBeard, setHasBeard] = useState(false);
  const [hasWash, setHasWash] = useState(false);
  const [bookedSlots, setBookedSlots] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const formatDateISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getAvailableSlotsForDate = (dateString: string) => {
    if (!dateString) return [];
    const date = new Date(dateString);
    const isSunday = date.getDay() === 0;
    if (isSunday) {
      return allTimeSlots.filter((slot) => parseInt(slot.split(":")[0]) < 16);
    }
    return allTimeSlots;
  };

  const currentSlots = getAvailableSlotsForDate(selectedDate);

  const isTimeInPast = (timeSlot: string) => {
    const now = new Date();
    const todayStr = formatDateISO(now);
    if (selectedDate !== todayStr) return false;
    const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    if (slotHours < currentHours) return true;
    if (slotHours === currentHours && slotMinutes <= currentMinutes) return true;
    return false;
  };

  const checkSlotAvailability = (time: string) => {
    const isBooked = bookedSlots.has(time);
    if (isBooked) return { disabled: true };
    if (isTimeInPast(time)) return { disabled: true };
    return { disabled: false };
  };

  useEffect(() => {
    if (selectedDate) {
      const fetchBookedSlots = async () => {
        const { data } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("appointment_date", selectedDate)
          .eq("status", "booked");
        if (data) setBookedSlots(new Set(data.map((s) => s.appointment_time)));
      };
      fetchBookedSlots();
    } else {
      setSelectedTime("");
      setBookedSlots(new Set());
    }
  }, [selectedDate]);

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    return date < today || date > maxDate;
  };

  const handleConfirmTime = () => {
    if (tempTime) {
      setSelectedTime(tempTime);
      setShowTimePicker(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. ZAŠTITA: Honeypot (Ako bot popuni ovo polje, samo prekidamo)
    if (website !== "") return;

    // 2. ZAŠTITA: Rate Limit (Sprečava više od 1 bookinga u 5 minuta sa istog browsera)
    const lastBooking = localStorage.getItem("last_booking_timestamp");
    if (lastBooking && Date.now() - parseInt(lastBooking) < 300000) {
      setMessage({ type: "error", text: "Too many attempts. Please wait 5 minutes." });
      return;
    }

    if (!firstName || !lastName || !phoneNumber || !selectedDate || !selectedTime) {
      setMessage({ type: "error", text: "Please fill in all fields!" });
      return;
    }

    setLoading(true);

    // 3. ZAŠTITA: Double-check baze pre samog upisa (u slučaju da je neko uzeo termin pre sekundu)
    const { data: alreadyTaken } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", selectedDate)
      .eq("appointment_time", selectedTime)
      .eq("status", "booked");

    if (alreadyTaken && alreadyTaken.length > 0) {
      setMessage({ type: "error", text: "This slot was just taken. Please choose another time." });
      setLoading(false);
      return;
    }

    const serviceNote = (hasBeard ? " + Beard" : "") + (hasWash ? " + Wash" : "");
    
    const { error } = await supabase.from("appointments").insert([
      {
        first_name: firstName,
        last_name: lastName + serviceNote,
        phone_number: phoneNumber,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: "booked",
      },
    ]);

    if (!error) {
      localStorage.setItem("last_booking_timestamp", Date.now().toString());
      setMessage({ type: "success", text: "Appointment booked successfully!" });
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setSelectedTime("");
      setSelectedDate("");
      setHasBeard(false);
      setHasWash(false);
    } else {
      setMessage({ type: "error", text: "Booking error. Please try again." });
    }
    setLoading(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = [];
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) days.push(null);
  for (let i = 1; i <= getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()); i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  return (
    <section id="booking" className="py-24 px-6 bg-black text-white relative z-50">
      {/* MESSAGE MODAL */}
      {message.text && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-black/90 backdrop-blur-md">
          <div className={`relative max-w-sm w-full p-10 rounded-3xl border-2 text-center bg-neutral-900 ${message.type === "success" ? "border-green-500" : "border-red-500"}`}>
            <div className="flex justify-center mb-6">
              {message.type === "success" ? <CheckCircle2 className="w-16 h-16 text-green-500" /> : <AlertCircle className="w-16 h-16 text-red-500" />}
            </div>
            <h3 className="text-xl font-black uppercase mb-4">{message.type === "success" ? "Success" : "Error"}</h3>
            <p className="text-neutral-400 mb-8">{message.text}</p>
            <button onClick={() => setMessage({ type: "", text: "" })} className="w-full py-4 bg-white text-black font-black rounded-xl uppercase">OK</button>
          </div>
        </div>
      )}

      {/* CALENDAR & TIME MODALS (Ostavljeno nepromenjeno zbog dizajna) */}
      {showCalendar && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-neutral-950 border border-neutral-800 p-8 rounded-3xl shadow-2xl">
            <button onClick={() => setShowCalendar(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}><ChevronLeft className="w-6 h-6" /></button>
              <span className="text-lg font-black uppercase tracking-widest">
                {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}><ChevronRight className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-[10px] text-neutral-600 font-bold mb-4 text-center">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {days.map((date, i) => {
                if (!date) return <div key={i} />;
                const dateISO = formatDateISO(date);
                const disabled = isDateDisabled(date);
                const isSelected = selectedDate === dateISO;
                return (
                  <button key={i} type="button" disabled={disabled}
                    onClick={() => { setSelectedDate(dateISO); setSelectedTime(""); setTempTime(""); setShowCalendar(false); setShowTimePicker(true); }}
                    className={`aspect-square flex items-center justify-center text-sm rounded-xl transition-all ${disabled ? "text-neutral-800 opacity-20" : "hover:bg-neutral-800 text-white"} ${isSelected ? "bg-white text-black font-black scale-110" : ""}`}>
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showTimePicker && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-neutral-950 border border-neutral-800 p-8 rounded-3xl shadow-2xl">
            <button onClick={() => { setShowTimePicker(false); setTempTime(""); }} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><X className="w-6 h-6" /></button>
            <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-center">Select Time</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {currentSlots.map((time) => {
                const { disabled } = checkSlotAvailability(time);
                const isSelected = tempTime === time;
                return (
                  <button key={time} type="button" disabled={disabled} onClick={() => !disabled && setTempTime(time)}
                    className={`py-5 rounded-2xl font-black text-lg transition-all border-2 ${isSelected ? "bg-white text-black border-white shadow-xl scale-105" : disabled ? "bg-neutral-900/30 text-neutral-800 border-neutral-900 cursor-not-allowed opacity-40" : "bg-neutral-900 text-white border-neutral-700 hover:border-white hover:bg-neutral-800"}`}>
                    {time}
                  </button>
                );
              })}
            </div>
            <button onClick={handleConfirmTime} disabled={!tempTime} className="w-full py-5 bg-white text-black font-black text-lg rounded-2xl uppercase tracking-tight disabled:opacity-50 hover:bg-neutral-200 transition-all">Confirm Time</button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-center mb-16 tracking-tighter italic uppercase underline decoration-white/10 underline-offset-[15px]">Booking</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HONEYPOT INPUT - Sakriven za ljude, botovi ga popunjavaju */}
          <input 
            type="text" 
            name="website" 
            tabIndex={-1} 
            autoComplete="off" 
            className="absolute opacity-0 -z-50 pointer-events-none" 
            value={website} 
            onChange={(e) => setWebsite(e.target.value)} 
          />

          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-neutral-900 border border-neutral-800 p-5 outline-none focus:border-white w-full rounded-2xl transition-all" />
            <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-neutral-900 border border-neutral-800 p-5 outline-none focus:border-white w-full rounded-2xl transition-all" />
          </div>
          <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="bg-neutral-900 border border-neutral-800 p-5 w-full outline-none focus:border-white rounded-2xl transition-all" />

          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => { setHasBeard(!hasBeard); setSelectedTime(""); setTempTime(""); }} className={`p-6 border-2 flex flex-col items-center gap-3 transition-all rounded-2xl ${hasBeard ? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-700 text-white"}`}>
              <Scissors className="w-8 h-8" />
              <span className="font-black uppercase tracking-wider text-sm">Beard Trim</span>
            </button>
            <button type="button" onClick={() => setHasWash(!hasWash)} className={`p-6 border-2 flex flex-col items-center gap-3 transition-all rounded-2xl ${hasWash ? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-700 text-white"}`}>
              <Droplets className="w-8 h-8" />
              <span className="font-black uppercase tracking-wider text-sm">Hair Wash</span>
            </button>
          </div>

          <button type="button" onClick={() => setShowCalendar(true)} className="w-full bg-neutral-900 border border-neutral-800 p-5 flex items-center justify-between hover:border-neutral-500 transition-all rounded-2xl group">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-neutral-500 uppercase font-black mb-1 group-hover:text-white">Date</span>
              <span className={selectedDate ? "text-white font-bold" : "text-neutral-400"}>
                {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Choose date"}
              </span>
            </div>
            <CalendarIcon className="w-6 h-6 text-neutral-500 group-hover:text-white" />
          </button>

          <div className="w-full bg-neutral-900 border border-neutral-800 p-5 flex items-center justify-between rounded-2xl">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-neutral-500 uppercase font-black mb-1">Time</span>
              <span className={selectedTime ? "text-white font-bold" : "text-neutral-400"}>{selectedTime || "Choose time after selecting date"}</span>
            </div>
            <Clock className="w-6 h-6 text-neutral-500" />
          </div>

          <button type="submit" disabled={loading || !selectedTime} className="w-full py-6 bg-white text-black font-black text-xl hover:bg-neutral-200 transition-all active:scale-[0.98] rounded-2xl shadow-xl mt-10 uppercase tracking-tighter disabled:opacity-50">
            {loading ? "Sending..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </section>
  );
}
