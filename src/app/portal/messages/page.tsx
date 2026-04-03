"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Thread {
  id: string;
  subject: string | null;
  lastMessageAt: string;
  hasUnread: boolean;
  listing: { id: string; address: string; city: string; imageUrl: string | null; priceAmount: number | null } | null;
  participants: Array<{ user: { id: string; name: string | null; role: string } }>;
  lastMessage: { body: string; sender: { id: string; name: string | null }; createdAt: string } | null;
}

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string | null; avatarUrl: string | null };
}

interface ThreadDetail {
  id: string;
  subject: string | null;
  listing: { id: string; address: string; city: string; priceAmount: number | null; beds: number | null; baths: number | null; imageUrl: string | null } | null;
  participants: Array<{ user: { id: string; name: string | null; role: string } }>;
  messages: Message[];
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadThreads(); }, []);

  async function loadThreads() {
    setLoading(true);
    const res = await fetch("/api/portal/messages");
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
    }
    setLoading(false);
  }

  async function openThread(threadId: string) {
    const res = await fetch(`/api/portal/messages/${threadId}`);
    if (res.ok) {
      const data = await res.json();
      setActiveThread(data.thread);
      loadThreads(); // Refresh unread counts
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeThread) return;
    setSending(true);
    await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newMessage, recipientId: null }),
    });
    setNewMessage("");
    setSending(false);
    // Reload thread
    openThread(activeThread.id);
  }

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen">
      {/* Thread list */}
      <div className={`w-full md:w-80 bg-white border-r border-navy/10 flex flex-col ${activeThread ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-navy/10 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-navy">Messages</h1>
          <button
            onClick={async () => {
              // Start a new direct message thread with agent
              const res = await fetch("/api/portal/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: "Hi! I'd like to chat about my home search.", subject: "New conversation" }),
              });
              if (res.ok) {
                const data = await res.json();
                loadThreads();
                if (data.threadId) openThread(data.threadId);
              }
            }}
            className="text-[10px] font-semibold tracking-wider uppercase bg-gold text-white px-3 py-1.5 hover:bg-gold-dark transition-colors"
          >
            + New
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-mid-gray text-sm">Loading...</div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center text-mid-gray text-sm">
            <p>No messages yet.</p>
            <button
              onClick={async () => {
                await fetch("/api/portal/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ body: "Hi! I'm looking for homes in Austin.", subject: "Getting started" }),
                });
                loadThreads();
              }}
              className="text-gold hover:text-gold-dark font-medium mt-2 inline-block"
            >
              Start a conversation with your agent
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {threads.map((thread) => {
              const otherParticipant = thread.participants.find((p) => p.user.id !== userId);
              return (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread.id)}
                  className={`w-full text-left p-4 border-b border-navy/5 hover:bg-warm-gray transition-colors ${
                    activeThread?.id === thread.id ? "bg-warm-gray" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {thread.listing?.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thread.listing.imageUrl} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${thread.hasUnread ? "font-bold text-navy" : "font-medium text-navy/70"}`}>
                          {otherParticipant?.user.name || "Agent"}
                        </p>
                        {thread.hasUnread && <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />}
                      </div>
                      {thread.listing && (
                        <p className="text-[11px] text-gold truncate">{thread.listing.address}</p>
                      )}
                      {thread.lastMessage && (
                        <p className="text-[12px] text-mid-gray truncate mt-0.5">{thread.lastMessage.body}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className={`flex-1 flex flex-col ${activeThread ? "flex" : "hidden md:flex"}`}>
        {activeThread ? (
          <>
            {/* Thread header */}
            <div className="p-4 border-b border-navy/10 bg-white flex items-center gap-3">
              <button
                onClick={() => setActiveThread(null)}
                className="md:hidden text-mid-gray hover:text-navy"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {activeThread.listing && (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {activeThread.listing.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeThread.listing.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-navy truncate">{activeThread.listing.address}</p>
                    <p className="text-[11px] text-mid-gray">
                      {activeThread.listing.priceAmount ? `$${activeThread.listing.priceAmount.toLocaleString()}` : ""} &middot; {activeThread.listing.city}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-warm-gray">
              {activeThread.messages.map((msg) => {
                const isMe = msg.sender.id === userId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${isMe ? "bg-navy text-white" : "bg-white text-navy"} p-3 shadow-sm`}>
                      {!isMe && (
                        <p className="text-[10px] font-semibold text-gold mb-1">{msg.sender.name}</p>
                      )}
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-white/40" : "text-mid-gray"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose */}
            <div className="p-4 bg-white border-t border-navy/10 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-navy/15 px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-gold text-white px-4 py-2.5 text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-mid-gray">
            <p>Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
