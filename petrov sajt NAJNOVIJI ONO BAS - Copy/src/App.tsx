import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
// 1. UVOZIMO NOVU KOMPONENTU
import ImageCarousel from "./components/ImageCarousel";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAdmin(!!session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setIsAdmin(!!session);
    setLoading(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        setShowAdminLogin(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        setShowAdminSetup(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (showAdminLogin && !isAdmin) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAdmin(true);
          setShowAdminLogin(false);
        }}
      />
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        onLogout={() => {
          setIsAdmin(false);
          setShowAdminLogin(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Hero />
      
      {/* 2. OVDE SMO UBACILI CAROUSEL */}
      {/* Možeš ga premestiti iznad Hero ako želiš da to bude prva stvar */}
      <ImageCarousel />

      <Services />
      <Booking />
      <Footer />
    </div>
  );
}

export default App;