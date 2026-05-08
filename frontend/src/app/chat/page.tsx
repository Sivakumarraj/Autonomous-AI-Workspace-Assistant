"use client";

import { useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await response.json();

      // Add AI response
      const aiMessage = {
        role: "ai",
        content: data.response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Error connecting to AI backend.",
        },
      ]);
    }

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          AI Workspace Chat
        </h1>

        <div className="border border-zinc-800 rounded-xl p-4 h-[500px] overflow-y-auto bg-zinc-900 mb-4">
          {messages.length === 0 && (
            <p className="text-zinc-500">
              Start chatting with Gemini AI...
            </p>
          )}

          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-600 ml-auto"
                    : "bg-zinc-800"
                }`}
              >
                <p className="text-sm mb-1 font-semibold">
                  {msg.role === "user" ? "You" : "AI"}
                </p>

                <p className="whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}