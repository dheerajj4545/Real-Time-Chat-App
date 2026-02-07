import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

export default function Chat() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username;

  const { room } = state || {};

  const socketRef = useRef(null);
  const fileRef = useRef();
  const avatarRef = useRef(null);
  const chatBoxRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);

  const [reactions, setReactions] = useState({});
  const [activeMsg, setActiveMsg] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showReactPicker, setShowReactPicker] = useState(null);

  useEffect(() => {
    if (!user) navigate("/");
  }, []);

  /* 🔥 CLICK ANYWHERE TO CLOSE REACTION BAR */
  useEffect(() => {
    const handleClick = () => {
      setActiveMsg(null);
      setShowReactPicker(null);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("https://chat-backend-pmbi.onrender.com/api/users");
    const data = await res.json();
    setAllUsers(data.filter((u) => u.username !== username));
  };

  useEffect(() => {
    if (username) fetchUsers();
  }, [username]);

  useEffect(() => {
    if (!username || !room) return;

    socketRef.current = io("https://chat-backend-pmbi.onrender.com");

    socketRef.current.emit("join", { username, room });

    socketRef.current.on("oldMessages", setMessages);

    socketRef.current.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);

      if (data.username !== username && !document.hidden) {
        socketRef.current.emit("seen", { room });
      }
    });

    socketRef.current.on("onlineUsers", setOnlineUsers);

    socketRef.current.on("typing", (name) => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(""), 1200);
    });

    socketRef.current.on("messageDeleted", (id) =>
      setMessages((prev) => prev.filter((m) => m.id !== id))
    );

    socketRef.current.on("seen", () => {
      setMessages((prev) =>
        prev.map((m) => ({ ...m, status: "seen" }))
      );
    });

    return () => socketRef.current.disconnect();
  }, [room, username]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    socketRef.current.emit("sendMessage", {
      message,
      username,
      room,
    });

    setMessage("");
  };

  const sendImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      socketRef.current.emit("sendMessage", {
        message: reader.result,
        username,
        room,
        type: "image",
      });
    };

    if (file) reader.readAsDataURL(file);
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const uploadAvatar = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      await fetch("https://chat-backend-pmbi.onrender.com/api/upload-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar: reader.result })
      });

      fetchUsers();
      alert("Avatar updated!");
    };

    if (file) reader.readAsDataURL(file);
  };

  const deleteMessage = (id) => {
    socketRef.current.emit("deleteMessage", { id, room });
  };

  const openPrivateChat = (otherUser) => {
    const privateRoom =
      username < otherUser.username
        ? `${username}_${otherUser.username}`
        : `${otherUser.username}_${username}`;

    navigate("/chat", { state: { room: privateRoom } });
  };

  const toggleReaction = (msgId, emoji) => {
    setReactions((prev) => {
      if (prev[msgId] === emoji) {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      }
      return { ...prev, [msgId]: emoji };
    });
  };

  const customReaction = (msgId, emojiData) => {
    toggleReaction(msgId, emojiData.emoji);
    setShowReactPicker(null);
  };

  return (
    <div className={`h-screen flex items-center justify-center relative overflow-hidden ${darkMode ? "bg-[#0f172a] text-white" : "bg-white text-black"}`}>

      <div className="absolute w-[600px] h-[600px] bg-purple-600 opacity-20 blur-[140px] top-[-200px] left-[-200px] animate-pulse"></div>
      <div className="absolute w-[600px] h-[600px] bg-blue-600 opacity-20 blur-[140px] bottom-[-200px] right-[-200px] animate-pulse"></div>

      <div className="w-[95%] h-[92%] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-64 max-sm:hidden bg-white/5 border-r border-white/10 p-5 overflow-y-auto">
          <h2 className="font-bold mb-4">Users</h2>

          {allUsers.map((u, i) => (
            <div
              key={i}
              onClick={() => openPrivateChat(u)}
              className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white/10 p-2 rounded"
            >
              {u.avatar ? (
                <img src={u.avatar} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center">
                  {u.username[0]}
                </div>
              )}

              <div>
                <div>{u.username}</div>
                <div className="text-[10px] opacity-70">
                  {u.isOnline
                    ? "Online"
                    : "Last seen " +
                      new Date(u.lastSeen).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CHAT */}
        <div className="flex-1 flex flex-col">

          {/* TOP BAR */}
          <div className="flex justify-between items-center p-4 bg-white/5 border-b border-white/10">
            <div>
              <h2 className="font-bold text-lg">Room: {room}</h2>
              <p className="text-xs opacity-70">You: {username}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="text-xs px-3 py-1 bg-gray-600 rounded"
              >
                🌗
              </button>

              <button
                onClick={() => avatarRef.current.click()}
                className="text-xs px-3 py-1 bg-purple-600 rounded"
              >
                Avatar
              </button>

              <input type="file" hidden ref={avatarRef} onChange={uploadAvatar} />

              <button
                onClick={() => {
                  localStorage.clear();
                  navigate("/");
                }}
                className="text-xs px-3 py-1 bg-red-600 rounded"
              >
                Logout
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMsg(msg.id);
                }}
                className={`flex ${
                  msg.username === username ? "justify-end" : "justify-start"
                }`}
              >
                <div className="bg-white/10 backdrop-blur p-3 rounded-xl max-w-xs relative">

                  {activeMsg === msg.id && (
                    <div className="absolute -top-8 left-2 bg-black/80 px-2 py-1 rounded flex gap-2 text-sm">
                      {["👍","❤️","😂","🔥","😮","😢"].map((emo) => (
                        <span
                          key={emo}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReaction(msg.id, emo);
                          }}
                        >
                          {emo}
                        </span>
                      ))}

                      <span
                        className="cursor-pointer font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReactPicker(msg.id);
                        }}
                      >
                        +
                      </span>
                    </div>
                  )}

                  {showReactPicker === msg.id && (
                    <div className="absolute -top-72 left-0">
                      <EmojiPicker onEmojiClick={(e)=>customReaction(msg.id,e)} />
                    </div>
                  )}

                  <p className="text-xs opacity-60">{msg.username}</p>

                  {msg.type === "image" ? (
                    <img src={msg.message} className="rounded mt-2" />
                  ) : (
                    <p>{msg.message}</p>
                  )}

                  {reactions[msg.id] && (
                    <div className="mt-1 text-lg">{reactions[msg.id]}</div>
                  )}

                  <p className="text-[10px] text-right">{msg.time}</p>

                  {msg.username === username && (
                    <p className="text-[10px] text-right opacity-70">
                      {msg.status === "seen" ? "✓✓ Seen" : "✓ Delivered"}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {typingUser && (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2 relative">

            {showEmoji && (
              <div className="absolute bottom-16">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}

            <input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                socketRef.current.emit("typing", { username, room });
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type..."
              className="flex-1 p-2 rounded bg-black/30"
            />

            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="bg-yellow-500 px-3 rounded"
            >
              🙂
            </button>

            <button onClick={sendMessage} className="bg-purple-600 px-4 rounded">
              Send
            </button>

            <button
              onClick={() => fileRef.current.click()}
              className="bg-blue-600 px-3 rounded"
            >
              📷
            </button>

            <input type="file" hidden ref={fileRef} onChange={sendImage} />
          </div>
        </div>
      </div>
    </div>
  );
}
