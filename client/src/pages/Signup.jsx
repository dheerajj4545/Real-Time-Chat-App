import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      return alert("Fill all fields");
    }

    try {
      const res = await fetch("https://chat-backend-pmbi.onrender.com/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created! Please login.");
        navigate("/");
      } else {
        alert(data);
      }
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">

      {/* Animated Background Blobs */}
      <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-30 animate-pulse bottom-10 right-10"></div>

      {/* Card */}
      <div className="relative bg-slate-800/80 p-10 rounded-2xl shadow-2xl w-[380px] border border-slate-700">

        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Create Account 
        </h1>

        {/* USERNAME */}
        <input
          type="text"
          placeholder="Enter username"
          className="w-full mb-4 p-3 rounded-lg bg-slate-900 text-white placeholder-gray-400 outline-none border border-slate-700 focus:border-purple-500"
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Enter email"
          className="w-full mb-4 p-3 rounded-lg bg-slate-900 text-white placeholder-gray-400 outline-none border border-slate-700 focus:border-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Enter password"
          className="w-full mb-6 p-3 rounded-lg bg-slate-900 text-white placeholder-gray-400 outline-none border border-slate-700 focus:border-purple-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-all text-white p-3 rounded-lg font-semibold"
        >
          Sign Up
        </button>

        {/* LOGIN LINK */}
        <p
          onClick={() => navigate("/")}
          className="text-center text-gray-300 mt-5 cursor-pointer hover:text-white"
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
