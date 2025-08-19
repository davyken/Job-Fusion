import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askGPT } from "@/utils/askGPT";
import { useUser } from "@clerk/clerk-react";

export default function ChatBot() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Send welcome message when opened for the first time
      const welcome = {
        role: "bot",
        content: `👋 Hi there! I'm JobBot, your JobFusion assistant. ${
          user?.unsafeMetadata?.role === "recruiter"
            ? "As a recruiter, I can help you post jobs, manage applications, and find candidates."
            : "As a job seeker, I can help you find and apply to jobs, save positions, and get AI-powered recommendations."
        }\n\nI can assist with:\n• Finding and applying to jobs\n• Uploading your CV for better recommendations\n• Saving jobs for later\n• Navigating the platform\n\nTry asking me: "How do I apply for a job?" or "How do I post a job?"\n\nWhat can I help you with today?`,
      };
      setMessages([welcome]);
    }
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Add context about the app and user to help the AI provide better responses
    const context = {
      app: "JobFusion",
      purpose: "Job search and recruitment platform",
      features: ["Job search", "Job posting", "CV upload", "AI recommendations", "Application tracking"],
      userRole: user?.unsafeMetadata?.role || "unknown"
    };

    try {
      const replyText = await askGPT(input, context);
      const botMsg = { role: "bot", content: replyText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = {
        role: "bot",
        content: "Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment. In the meantime, you can:\n• Check your internet connection\n• Try rephrasing your question\n• Visit our FAQ section for common questions"
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="w-80 h-96 flex flex-col shadow-xl border-2 border-muted bg-black">
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-3 text-sm ${
                    msg.role === "user" ? "text-right text-blue-700" : "text-left text-green-700"
                  }`}
                >
                  <b>{msg.role === "user" ? "You" : "Bot"}:</b> {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="text-left text-green-700 text-sm mb-3">
                  <b>Bot:</b> <span className="inline-block animate-pulse">Thinking...</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
              placeholder="Ask me something..."
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading}>
              {isLoading ? "..." : "Send"}
            </Button>
          </div>
          <div className="p-4 border-t text-xs text-gray-500">
            Try: "How do I apply for a job?", "How do I post a job?", "How do I save a job?"
          </div>
        </Card>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setOpen((prev) => !prev);
            // Clear messages when closing the chat
            if (open) {
              setMessages([]);
            }
          }}
          className="rounded-full w-14 h-14 p-0 text-xl shadow-md bg-black text-white"
        >
          💬
        </Button>
        {open && (
          <Button
            onClick={() => setMessages([])}
            className="rounded-full w-14 h-14 p-0 text-xl shadow-md bg-gray-600 text-white"
            title="Clear chat"
          >
            🗑️
          </Button>
        )}
      </div>
    </div>
  );
}
