import { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogIn } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        setError(res.error.message || "Unknown auth error");
        setLoading(false);
        return;
      }
      const userRes = await supabase.auth.getUser();
      if (userRes.error || !userRes.data?.user) {
        setError("Login succeeded but no active session found.");
        setLoading(false);
        return;
      }
      // Dozvoljen samo login postojećih naloga iz Supabase
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Unexpected error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <LogIn
            className="w-16 h-16 mx-auto mb-4 text-neutral-300"
            strokeWidth={1.5}
          />
          <h1 className="text-4xl font-bold text-white mb-2">ADMIN LOGIN</h1>
          <p className="text-neutral-400">
            Access restricted to authorized personnel
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-neutral-400 mb-3 text-sm uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 px-6 py-4 text-white focus:outline-none focus:border-neutral-600 transition-colors"
              placeholder="admin@elitecuts.com"
              required
            />
          </div>
          <div>
            <label className="block text-neutral-400 mb-3 text-sm uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 px-6 py-4 text-white focus:outline-none focus:border-neutral-600 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="bg-red-900 text-red-100 px-6 py-4 text-center">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-white text-black font-bold text-lg hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
}
