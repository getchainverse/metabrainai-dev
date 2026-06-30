import React, { useEffect, useMemo, useRef, useState } from "react";
import SocialService from "../services/social.service";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import { ShowErrorMessage, ShowSuccessMessage } from "./common/Message";

const Social = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedFriend, setSelectedFriend] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const selectedFriendRef = useRef(selectedFriend);
  selectedFriendRef.current = selectedFriend;

  const socketHandlers = useMemo(
    () => ({
      "social:init": ({ onlineUsers: initialOnline = [] }) => {
        setOnlineUsers(
          initialOnline.reduce((acc, user) => {
            acc[user.userId] = user;
            return acc;
          }, {})
        );
      },
      "social:presence": ({ userId, status }) => {
        setOnlineUsers((current) => ({
          ...current,
          [userId]: { ...(current[userId] || {}), status },
        }));
      },
      "social:friend-request": () => {
        SocialService.getRequests().then(setRequests);
        SocialService.getNotifications().then(setNotifications);
      },
      "social:message": () => {
        if (selectedFriendRef.current) {
          SocialService.getMessages(selectedFriendRef.current).then(setMessages);
        }
        SocialService.getNotifications().then(setNotifications);
      },
      "social:notification": () => {
        SocialService.getNotifications().then(setNotifications);
      },
    }),
    []
  );

  useSocket(socketHandlers);

  useEffect(() => {
    const load = async () => {
      try {
        const [friendsData, requestsData, notificationsData] = await Promise.all([
          SocialService.getFriends(),
          SocialService.getRequests(),
          SocialService.getNotifications(),
        ]);
        setFriends(friendsData || []);
        setRequests(requestsData || []);
        setNotifications(notificationsData || []);
      } catch (error) {
        ShowErrorMessage(error?.response?.data?.message || "Unable to load social data.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedFriend) return;
    SocialService.getMessages(selectedFriend).then(setMessages).catch(() => setMessages([]));
  }, [selectedFriend]);

  const visibleUsers = useMemo(() => Object.values(onlineUsers), [onlineUsers]);

  const sendRequest = async () => {
    if (!receiverId) return;
    setFriendRequestLoading(true);
    try {
      await SocialService.sendFriendRequest({ receiverId, message: requestMessage });
      setReceiverId("");
      setRequestMessage("");
      const [requestsData, notificationsData] = await Promise.all([
        SocialService.getRequests(),
        SocialService.getNotifications(),
      ]);
      setRequests(requestsData || []);
      setNotifications(notificationsData || []);
      ShowSuccessMessage("Friend request sent.");
    } catch (error) {
      ShowErrorMessage(error?.response?.data?.message || "Unable to send request.");
    } finally {
      setFriendRequestLoading(false);
    }
  };

  const respond = async (id, action) => {
    try {
      await SocialService.respondToFriendRequest(id, { action });
      const [friendsData, requestsData, notificationsData] = await Promise.all([
        SocialService.getFriends(),
        SocialService.getRequests(),
        SocialService.getNotifications(),
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
      setNotifications(notificationsData || []);
      ShowSuccessMessage(`Request ${action}ed.`);
    } catch (error) {
      ShowErrorMessage(error?.response?.data?.message || "Unable to update request.");
    }
  };

  const sendPrivateMessage = async () => {
    if (!selectedFriend || !content.trim()) return;
    try {
      await SocialService.sendMessage({ receiverId: selectedFriend, content });
      setContent("");
      const nextMessages = await SocialService.getMessages(selectedFriend);
      setMessages(nextMessages || []);
    } catch (error) {
      ShowErrorMessage(error?.response?.data?.message || "Unable to send message.");
    }
  };

  const markRead = async (id) => {
    await SocialService.markNotificationRead(id);
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
  };

  const copyUserId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      ShowSuccessMessage("User ID copied to clipboard!");
    }
  };

  const selectedFriendDetails = useMemo(() => {
    const friendship = friends.find((f) => f.friend.id === selectedFriend);
    return friendship?.friend;
  }, [friends, selectedFriend]);

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 py-10 px-4 sm:px-6">
      <main className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/5 pb-6">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">Social</h1>
          <p className="mt-2 text-sm text-slate-400">Friend requests, private chat, presence, and notifications.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
          {/* Identity & Friend Requests Card */}
          <section className="space-y-6">
            {/* Copyable User ID Panel */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">My Identity</h3>
              <p className="mt-2 text-xs text-slate-400">Share your ID with friends so they can add you:</p>
              <div
                onClick={copyUserId}
                className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-950/80 transition"
              >
                <code className="text-xs text-slate-300 font-mono truncate">{currentUser?.id}</code>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 shrink-0">Copy</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl">
              <h2 className="text-lg font-bold tracking-wide text-cyan-400">Add Friend</h2>
              <div className="mt-4 space-y-4">
                <input
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  placeholder="Enter User ID"
                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none focus:border-cyan-500 transition-colors"
                />
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Optional invitation note"
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500 transition-colors resize-none"
                />
                <button
                  disabled={friendRequestLoading}
                  onClick={sendRequest}
                  className="w-full min-h-[44px] rounded-xl bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider hover:bg-cyan-300 transition disabled:opacity-50"
                >
                  Send Request
                </button>
              </div>

              <h2 className="text-lg font-bold tracking-wide text-cyan-400 mt-8 border-t border-white/5 pt-6">Friend Requests</h2>
              <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {requests.length === 0 && <p className="text-xs text-slate-500 py-2">No pending requests.</p>}
                {requests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-white/5 bg-slate-950/40 p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-200 truncate pr-2">
                        {request.sender?.username || request.sender?.walletAddress.slice(0, 8)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded text-slate-400">
                        {request.status}
                      </span>
                    </div>
                    {request.message && <p className="text-xs text-slate-400 italic">"{request.message}"</p>}
                    {request.status === "pending" && request.receiverId === currentUser?.id && (
                      <div className="flex gap-2 mt-1">
                        <button
                          className="flex-1 rounded bg-emerald-500/80 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition"
                          onClick={() => respond(request.id, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          className="flex-1 rounded bg-rose-500/80 hover:bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition"
                          onClick={() => respond(request.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Direct Private Chat Card */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl flex flex-col min-h-[500px]">
            <h2 className="text-xl font-bold tracking-wide text-cyan-400">Private Chat</h2>
            
            {/* Friends Selector List */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-3 border-b border-white/5 scrollbar-thin">
              {friends.length === 0 && <p className="text-xs text-slate-500 py-2">Add friends to start messaging.</p>}
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend.friend.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-2 ${
                    selectedFriend === friend.friend.id
                      ? "border-cyan-500 bg-cyan-500 text-slate-950"
                      : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span>{friend.friend.username || "Friend"}</span>
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                    onlineUsers[friend.friend.id]?.status === "online" ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-600"
                  }`} />
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 mt-4 min-h-[300px] max-h-[400px] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
              {!selectedFriend && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Select a friend to begin chatting.
                </div>
              )}
              {selectedFriend && messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Send a message to start the conversation!
                </div>
              )}
              {messages.map((msg) => {
                const isSelf = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                    <div className="flex flex-col max-w-[75%]">
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        isSelf
                          ? "bg-cyan-500 text-slate-950 rounded-tr-none shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                          : "bg-slate-800 text-slate-100 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Emojis Row */}
            {selectedFriend && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {["👋", "👍", "❤️", "🔥", "😂", "✨", "🎮", "🚀"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setContent((current) => current + emoji)}
                    className="rounded-lg bg-slate-800/80 hover:bg-slate-700 px-3 py-1 text-sm transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendPrivateMessage(); }}
              className="mt-4 flex gap-2"
            >
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={selectedFriend ? `Message ${selectedFriendDetails?.username || "friend"}` : "Select a friend..."}
                disabled={!selectedFriend}
                className="flex-1 min-h-[44px] rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-slate-100 outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!selectedFriend || !content.trim()}
                className="rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-5 font-bold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </section>

          {/* Presence & Notifications Cards */}
          <section className="space-y-6">
            {/* Online Status Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl">
              <h2 className="text-lg font-bold tracking-wide text-cyan-400">Online Users</h2>
              <div className="mt-4 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {visibleUsers.length === 0 && <p className="text-xs text-slate-500">No users currently online.</p>}
                {visibleUsers.map((user) => {
                  const alreadyFriend = friends.some((f) => f.friend.id === user.userId);
                  const isSelf = user.userId === currentUser?.id;
                  return (
                    <div key={user.userId} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2.5">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-sm text-slate-200 truncate">{user.username || "Guest"}</span>
                        <span className="text-[9px] text-slate-500 font-mono truncate">{user.userId}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {user.status}
                        </span>
                        {!alreadyFriend && !isSelf && (
                          <button
                            type="button"
                            onClick={() => {
                              setReceiverId(user.userId);
                              ShowSuccessMessage("User ID loaded! Just click Send Request to invite them.");
                            }}
                            className="rounded bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 px-2 py-1 text-[10px] font-bold text-cyan-400 transition"
                          >
                            + Invite
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notifications Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md shadow-xl">
              <h2 className="text-lg font-bold tracking-wide text-cyan-400">Notifications</h2>
              <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {notifications.length === 0 && <p className="text-xs text-slate-500">No recent notifications.</p>}
                {notifications.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => markRead(note.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      note.isRead
                        ? "border-white/5 bg-slate-950/20 text-slate-400"
                        : "border-cyan-500/30 bg-cyan-500/5 text-slate-100 hover:bg-cyan-500/10"
                    }`}
                  >
                    <p className="font-bold text-xs uppercase tracking-wider text-cyan-400 mb-1">{note.title}</p>
                    <p className="text-xs leading-5">{note.body}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Social;
