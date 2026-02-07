import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) return alert("Fill all fields");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token) {
        // Save JWT + user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Room select page pe bhejo
        navigate("/room");
      } else {
        alert(data);
      }
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">

      {/* Animated Background Blobs */}
      <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-30 animate-pulse bottom-10 right-10"></div>

      {/* Card */}
      <div className="relative bg-slate-800/80 p-10 rounded-2xl shadow-2xl w-[380px] border border-slate-700">

        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Real-Time Chat 🚀
        </h1>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Enter email"
          className="w-full mb-4 p-3 rounded-lg bg-slate-900 text-white placeholder-gray-400 outline-none border border-slate-700 focus:border-purple-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Enter password"
          className="w-full mb-6 p-3 rounded-lg bg-slate-900 text-white placeholder-gray-400 outline-none border border-slate-700 focus:border-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-all text-white p-3 rounded-lg font-semibold"
        >
          Login
        </button>

        {/* SIGNUP LINK */}
        <p
          onClick={() => navigate("/signup")}
          className="text-center text-gray-300 mt-5 cursor-pointer hover:text-white"
        >
          Create new account
        </p>
      </div>
    </div>
  );
}
