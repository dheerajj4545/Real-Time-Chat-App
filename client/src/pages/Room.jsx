import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Room() {
  const [room, setRoom] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔒 If not logged in → go login
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, []);

  const joinRoom = () => {
    if (!room) return alert("Enter room name");

    navigate("/chat", { state: { room } });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">

      {/* Animated Background Blobs */}
      <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-30 animate-pulse bottom-10 right-10"></div>

      {/* Card */}
      <div className="relative bg-slate-800/80 p-10 rounded-2xl shadow-2xl w-[380px] border border-slate-700">

        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Join Room 💬
        </h1>

        <input
          type="text"
          placeholder="Enter room name"
          className="w-full mb-6 p-3 rounded-lg bg-slate-900 text-white placeholder-gray-400 outline-none border border-slate-700 focus:border-purple-500"
          onChange={(e) => setRoom(e.target.value)}
        />

        <button
          onClick={joinRoom}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-all text-white p-3 rounded-lg font-semibold"
        >
          Enter Chat
        </button>
      </div>
    </div>
  );
}
