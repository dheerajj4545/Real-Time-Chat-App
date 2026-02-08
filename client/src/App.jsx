import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Room from "./pages/Room";
import Chat from "./pages/Chat";

function App() {

  
  // useEffect(() => {
  //   fetch("https://chat-backend-pmbi.onrender.com")
  //     .catch(() => {}); // silent fail ignore
  // }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/room" element={<Room />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
