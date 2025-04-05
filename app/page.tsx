"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Key, Clock, Database, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface KnowledgeItem {
  id: string;
  text: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [databaseEntry, setDatabaseEntry] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge">("chat");
  const [latestDate, setLatestDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("gemini_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Load knowledge base on component mount
  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  // Fetch knowledge base
  const fetchKnowledgeBase = async (pageNumber = 1) => {
    try {
      setIsLoadingMore(true);
      const response = await fetch(
        `/api/documents?page=${pageNumber}&limit=${ITEMS_PER_PAGE}`
      );
      if (response.ok) {
        const data = await response.json();
        if (pageNumber === 1) {
          setKnowledgeBase(data.documents);
        } else {
          // เพิ่ม type KnowledgeItem ให้กับ doc
          setKnowledgeBase((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newDocs = data.documents.filter(
              (doc: KnowledgeItem) => !existingIds.has(doc.id)
            );
            return [...prev, ...newDocs];
          });
        }
        setHasMore(data.documents.length === ITEMS_PER_PAGE);
        if (data.latestDate) {
          setLatestDate(new Date(data.latestDate));
        }
      }
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatDate = (date: Date | string) => {
    // แปลง string เป็น Date object ก่อนใช้งาน
    const dateObject = date instanceof Date ? date : new Date(date);
    // force +7 ชั่วโมง (7 * 60 * 60 * 1000 milliseconds)
    const bkkTime = new Date(dateObject.getTime() + 7 * 60 * 60 * 1000);
    return format(bkkTime, "dd MMM yyyy, HH:mm", { locale: th });
  };

  // Handle chat submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          apiKey: apiKey || undefined, // Send API key if available
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant message to chat
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        createdAt: new Date(data.createdAt),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งค่ะ",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle API key submission
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) return;

    // Save API key to localStorage
    localStorage.setItem("gemini_api_key", apiKey);
    setShowApiKeyInput(false);

    // Add confirmation message
    const confirmMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "บันทึก API Key เรียบร้อยแล้วค่ะ",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, confirmMessage]);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add document to knowledge base
  const handleDatabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!databaseEntry.trim()) return;

    setIsAddingDocument(true);
    try {
      const response = await fetch("/api/add-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: databaseEntry,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add document");
      }

      const data = await response.json();

      if (data.success) {
        await fetchKnowledgeBase(1);
        setDatabaseEntry("");

        // แสดงข้อความสำเร็จ
        const successMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "เพิ่มข้อมูลลงในฐานความรู้เรียบร้อยแล้วค่ะ 📚",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      }
    } catch (error) {
      console.error("Error adding document:", error);

      // แสดงข้อความ error
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "ขออภัยค่ะ เกิดข้อผิดพลาดในการเพิ่มข้อมูล กรุณาลองใหม่อีกครั้งค่ะ 🙏",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAddingDocument(false);
    }
  };

  // Remove document from knowledge base
  const removeKnowledgeItem = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setKnowledgeBase((prev) => prev.filter((item) => item.id !== id));

        // แสดงข้อความสำเร็จ
        const successMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "ลบข้อมูลเรียบร้อยแล้วค่ะ 🗑️",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error removing document:", error);

      // แสดงข้อความ error
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "ขออภัยค่ะ เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้งค่ะ 🙏",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // เพิ่ม useEffect สำหรับ infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchKnowledgeBase(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <header className="py-6 px-8">
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          What if, Chat?
        </h1>
        <p className="text-center text-gray-500 mt-1">
          latest data collection: {formatDate(latestDate)}
        </p>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        {/* Mobile Tab Switcher */}
        <div className="md:hidden mb-4">
          <Tabs
            defaultValue="chat"
            onValueChange={(value) =>
              setActiveTab(value as "chat" | "knowledge")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                แชท
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                ฐานความรู้
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <Card
            className={cn(
              "flex flex-col h-[75vh] bg-white/30 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden",
              "md:flex",
              activeTab === "chat" ? "flex" : "hidden"
            )}
          >
            <div className="p-4 border-b border-white/10 bg-white/20">
              <h2 className="text-lg font-medium text-gray-800">แชท</h2>
              <p className="text-sm text-gray-600">ถามคำถามกับ RAG+Chat</p>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-6">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-gray-400">เริ่มการสนทนากับ AI</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[85%]">
                      <div
                        className={cn(
                          "rounded-2xl p-4 shadow-sm",
                          message.role === "user"
                            ? "bg-blue-500/90 text-white rounded-tr-none"
                            : "bg-white/40 backdrop-blur-sm text-gray-800 rounded-tl-none"
                        )}
                      >
                        {message.content}
                      </div>
                      <div
                        className={cn(
                          "flex items-center text-xs mt-1 space-x-1",
                          message.role === "user"
                            ? "justify-end text-gray-500"
                            : "justify-start text-gray-500"
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="mt-auto p-4 bg-white/20 border-t border-white/10">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="พิมพ์ข้อความของคุณ..."
                  className="flex-1 bg-white/50 border-white/20"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </Card>

          {/* Knowledge Base Management */}
          <Card
            className={cn(
              "flex flex-col h-[75vh] bg-white/30 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl overflow-hidden",
              "md:flex",
              activeTab === "knowledge" ? "flex" : "hidden"
            )}
          >
            <div className="p-4 border-b border-white/10 bg-white/20 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  ฐานความรู้
                </h2>
                <p className="text-sm text-gray-600">เพิ่มข้อมูลสำหรับ RAG</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4">
              {knowledgeBase.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">ยังไม่มีข้อมูลในฐานความรู้</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeBase.map((item) => (
                    <div
                      key={`${item.id}-${new Date(item.timestamp).getTime()}`}
                      className="group p-3 bg-white/40 backdrop-blur-sm rounded-lg shadow-sm relative"
                    >
                      <p className="pr-8 text-gray-700">{item.text}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                      <button
                        onClick={() => removeKnowledgeItem(item.id)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}

                  {/* Loading indicator และ Observer target */}
                  <div ref={observerTarget} className="py-4">
                    {isLoadingMore && (
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto p-4 bg-white/20 border-t border-white/10">
              <form onSubmit={handleDatabaseSubmit} className="space-y-3">
                <Textarea
                  value={databaseEntry}
                  onChange={(e) => setDatabaseEntry(e.target.value)}
                  placeholder="เพิ่มข้อมูลลงในฐานความรู้ของคุณ..."
                  className="resize-none bg-white/50 border-white/20"
                />
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  disabled={isAddingDocument}
                >
                  {isAddingDocument ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มลงในฐานความรู้
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
