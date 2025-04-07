"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Send,
  Key,
  Clock,
  Database,
  Plus,
  Trash2,
  Eraser,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";

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

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

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
  const [isDeletingItems, setIsDeletingItems] = useState<Set<string>>(
    new Set()
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [chatMode, setChatMode] = useState<"gemini" | "rag">("rag");
  const [geminiMessages, setGeminiMessages] = useState<Message[]>([]);
  const [ragMessages, setRagMessages] = useState<Message[]>([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const titles = ["Easy Chat?", "Simple Chat", "Example Chat"];
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // เพิ่ม transition class
  const transitionClass = "transition-all duration-300 ease-in-out";

  // แยก welcome message สำหรับแต่ละโหมด
  const geminiWelcomeMessage: Message = {
    id: generateId(),
    role: "assistant",
    content: `สวัสดีค่ะ ฉันชื่อมะขาม 😊 

ในโหมด Gemini นี้ เราสามารถคุยกันได้อย่างอิสระเลยนะคะ มะขามพร้อมตอบทุกคำถามค่ะ!`,
    createdAt: new Date(),
  };

  const ragWelcomeMessage: Message = {
    id: generateId(),
    role: "assistant",
    content: `สวัสดีค่ะ ฉันชื่อน้อยหน่า จาก จัส อีซี่ (Just Easy) 😊 

ในโหมด Gemini + RAG นี้ น้อยหน่าจะตอบคำถามตามข้อมูลที่มีในฐานข้อมูลนะคะ สามารถเพิ่มข้อมูลได้ที่แท็บ "ฐานข้อมูล" เลยค่ะ`,
    createdAt: new Date(),
  };

  // ปรับ useEffect สำหรับ welcome message
  useEffect(() => {
    const savedApiKey = localStorage.getItem("gemini_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    // เพิ่ม welcome message แยกตามโหมด
    setGeminiMessages([geminiWelcomeMessage]);
    setRagMessages([ragWelcomeMessage]);
  }, []);

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const fetchKnowledgeBase = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/documents?page=${pageNumber}&limit=${ITEMS_PER_PAGE}`
      );
      if (response.ok) {
        const data = await response.json();
        if (pageNumber === 1) {
          setKnowledgeBase(data.documents);
        } else {
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
        console.log(
          "Fetched page:",
          pageNumber,
          "hasMore:",
          data.documents.length === ITEMS_PER_PAGE
        );
      }
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObject = date instanceof Date ? date : new Date(date);
    const bkkTime = new Date(dateObject.getTime() + 7 * 60 * 60 * 1000);
    return format(bkkTime, "dd MMM yyyy, HH:mm", { locale: th });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    // เพิ่มข้อความผู้ใช้ไปยัง state ที่เหมาะสม
    if (chatMode === "gemini") {
      setGeminiMessages((prev) => [...prev, userMessage]);
    } else {
      setRagMessages((prev) => [...prev, userMessage]);
    }

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          apiKey: apiKey || undefined,
          mode: chatMode,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.content,
        createdAt: new Date(),
      };

      // เพิ่มข้อความ AI ไปยัง state ที่เหมาะสม
      if (chatMode === "gemini") {
        setGeminiMessages((prev) => [...prev, assistantMessage]);
      } else {
        setRagMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content:
          "ขออภัยค่ะ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งค่ะ",
        createdAt: new Date(),
      };

      if (chatMode === "gemini") {
        setGeminiMessages((prev) => [...prev, errorMessage]);
      } else {
        setRagMessages((prev) => [...prev, errorMessage]);
      }
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
      id: generateId(),
      role: "assistant",
      content: "บันทึก API Key เรียบร้อยแล้วค่ะ",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, confirmMessage]);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    // ดึงข้อความปัจจุบันตามโหมด
    const currentMessages =
      chatMode === "gemini" ? geminiMessages : ragMessages;

    // scroll ลงล่างเมื่อมีข้อความใหม่หรือกำลังโหลด
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [geminiMessages, ragMessages, isLoading]); // เพิ่ม dependency ให้ทำงานเมื่อมีการเปลี่ยนแปลงข้อความหรือสถานะ loading

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
          id: generateId(),
          role: "assistant",
          content: "เพิ่มข้อมูลลงในฐานข้อมูลเรียบร้อยแล้วค่ะ 📚",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      }
    } catch (error) {
      console.error("Error adding document:", error);

      // แสดงข้อความ error
      const errorMessage: Message = {
        id: generateId(),
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
    if (isDeletingItems.has(id)) return;

    try {
      setIsDeletingItems((prev) => new Set([...prev, id]));
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setKnowledgeBase((prev) => prev.filter((item) => item.id !== id));
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error removing document:", error);
    } finally {
      setIsDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // เพิ่ม useEffect สำหรับ infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isInitialLoading
        ) {
          setIsLoadingMore(true);
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, isLoadingMore, isInitialLoading]);

  useEffect(() => {
    if (page > 1) {
      fetchKnowledgeBase(page);
    }
  }, [page]);

  const KnowledgeItemSkeleton = () => (
    <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg shadow-sm relative">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-1 mt-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );

  // Skeleton component สำหรับ response message
  const ResponseMessageSkeleton = () => (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl rounded-tl-none p-4 shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center text-xs mt-1 space-x-1 text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatDate(new Date())}</span>
        </div>
      </div>
    </div>
  );

  // เพิ่มฟังก์ชัน clearHistory
  const clearHistory = () => {
    if (chatMode === "gemini") {
      setGeminiMessages([geminiWelcomeMessage]);
    } else {
      setRagMessages([ragWelcomeMessage]);
    }
  };

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % titles.length;

      const fullText = titles[i];

      setCurrentTitle(
        isDeletingItems.has(i.toString())
          ? fullText.substring(0, currentTitle.length - 1)
          : fullText.substring(0, currentTitle.length + 1)
      );

      setTypingSpeed(isDeletingItems.has(i.toString()) ? 75 : 150);

      if (!isDeletingItems.has(i.toString()) && currentTitle === fullText) {
        setTimeout(() => {
          const itemId = i.toString();
          setIsDeletingItems(new Set([itemId]));
        }, 5000);
      } else if (isDeletingItems.has(i.toString()) && currentTitle === "") {
        setIsDeletingItems(new Set());
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentTitle, isDeletingItems, loopNum, typingSpeed]);

  return (
    <div
      className={cn(
        "flex flex-col min-h-screen",
        transitionClass,
        chatMode === "gemini"
          ? "bg-gradient-to-br from-violet-50 via-white to-violet-100"
          : "bg-gradient-to-br from-violet-50 via-white to-emerald-100"
      )}
    >
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <header className="py-3 md:py-6 px-4 md:px-8">
        <h1 className="text-xl md:text-2xl font-semibold text-center">
          Just{" "}
          <motion.span
            key={loopNum}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "inline-block",
              titles[loopNum % titles.length] === "Easy Chat?"
                ? "bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent"
                : "text-gray-400 "
            )}
          >
            {currentTitle}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className={cn(
                "ml-0.5",
                titles[loopNum % titles.length] === "Easy Chat?"
                  ? "bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent"
                  : "text-gray-400"
              )}
            >
              |
            </motion.span>
          </motion.span>
        </h1>
        <p className="text-xs md:text-sm text-center text-gray-500 mt-0.5 md:mt-1">
          latest data collection:{" "}
          {latestDate ? formatDate(latestDate) : "ยังไม่มีข้อมูล"}
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
                ฐานข้อมูล
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <Card
            className={cn(
              "flex flex-col h-[75vh] backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden",
              "md:flex",
              activeTab === "chat" ? "flex" : "hidden",
              transitionClass,
              // สีพื้นหลังและ border ตามโหมด
              chatMode === "gemini"
                ? "bg-white/80 border border-violet-100"
                : "bg-white/80 border border-emerald-100"
            )}
          >
            <div
              className={cn(
                "p-4 border-b",
                transitionClass,
                chatMode === "gemini"
                  ? "bg-violet-50/50 border-violet-100"
                  : "bg-gradient-to-r from-violet-50/50 to-emerald-50/50 border-emerald-100"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-800">แชท</h2>
                  <p
                    className={cn(
                      "text-xs",
                      transitionClass,
                      chatMode === "gemini"
                        ? "text-violet-500"
                        : "text-emerald-600"
                    )}
                  >
                    by Gemini 2.0 flash
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant={chatMode === "gemini" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChatMode("gemini")}
                    className={cn(
                      transitionClass,
                      "rounded-full",
                      chatMode === "gemini"
                        ? "bg-violet-500 hover:bg-violet-600 text-white shadow-md"
                        : "text-violet-500 hover:text-violet-600 border-violet-200"
                    )}
                  >
                    Gemini
                  </Button>
                  <Button
                    variant={chatMode === "rag" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChatMode("rag")}
                    className={cn(
                      transitionClass,
                      "rounded-full",
                      chatMode === "rag"
                        ? "bg-gradient-to-r from-violet-500 to-emerald-500 hover:from-violet-600 hover:to-emerald-600 text-white shadow-md"
                        : "text-emerald-600 hover:text-emerald-700 border-emerald-200"
                    )}
                  >
                    Gemini + RAG
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-6">
              <div className="space-y-6">
                {(chatMode === "gemini" ? geminiMessages : ragMessages)
                  .length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-400">
                      {chatMode === "gemini"
                        ? "เริ่มการสนทนากับ Gemini"
                        : "เริ่มการสนทนากับ Gemini + RAG"}
                    </p>
                  </div>
                ) : (
                  <>
                    {(chatMode === "gemini" ? geminiMessages : ragMessages).map(
                      (message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div className="max-w-[85%]">
                            <div
                              className={cn(
                                "rounded-2xl p-4 shadow-sm",
                                transitionClass,
                                message.role === "user"
                                  ? "bg-gray-100 text-gray-800 rounded-tr-none border border-gray-200"
                                  : chatMode === "gemini"
                                  ? "bg-violet-50 text-gray-800 rounded-tl-none border border-violet-100"
                                  : "bg-gradient-to-r from-violet-50 to-emerald-50 text-gray-800 rounded-tl-none border border-emerald-100"
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
                      )
                    )}
                    {isLoading && <ResponseMessageSkeleton />}
                  </>
                )}
                <div ref={messagesEndRef} className="h-px" />
              </div>
            </div>

            <div
              className={cn(
                "mt-auto p-4 border-t",
                transitionClass,
                chatMode === "gemini"
                  ? "bg-violet-50/50 border-violet-100"
                  : "bg-gradient-to-r from-violet-50/50 to-emerald-50/50 border-emerald-100"
              )}
            >
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Button
                  type="button"
                  size="icon"
                  onClick={clearHistory}
                  className={cn(
                    transitionClass,
                    "rounded-full",
                    chatMode === "gemini"
                      ? "bg-violet-100 hover:bg-violet-200 text-violet-600"
                      : "bg-emerald-100 hover:bg-emerald-200 text-emerald-600"
                  )}
                  title="เริ่มการสนทนาใหม่"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="พิมพ์ข้อความของคุณ..."
                  className={cn(
                    "flex-1 rounded-full",
                    transitionClass,
                    chatMode === "gemini"
                      ? "bg-white border-violet-200 focus:border-violet-400 placeholder:text-violet-300"
                      : "bg-white border-emerald-200 focus:border-emerald-400 placeholder:text-emerald-300"
                  )}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    transitionClass,
                    "rounded-full shadow-md",
                    chatMode === "gemini"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : "bg-gradient-to-r from-violet-500 to-emerald-500 hover:from-violet-600 hover:to-emerald-600"
                  )}
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
              "flex flex-col h-[75vh] bg-green-50/50 backdrop-blur-sm border border-green-100 shadow-xl rounded-2xl overflow-hidden",
              "md:flex",
              activeTab === "knowledge" ? "flex" : "hidden"
            )}
          >
            <div className="p-4 border-b border-green-100 bg-green-50/70 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-green-900 flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-700" />
                  ฐานข้อมูล
                </h2>
                <p className="text-sm text-green-700">
                  Please remember if trash in also trash out!
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4 bg-green-50/30">
              {isInitialLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <KnowledgeItemSkeleton key={i} />
                  ))}
                </div>
              ) : knowledgeBase.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-green-700">ยังไม่มีข้อมูลในฐานข้อมูล</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeBase.map((item) => (
                    <div
                      key={`${item.id}-${new Date(item.timestamp).getTime()}`}
                      className="rounded-lg overflow-hidden"
                    >
                      {isDeletingItems.has(item.id) ? (
                        <div className="p-3 bg-green-50/70 backdrop-blur-md rounded-lg shadow-sm">
                          <Skeleton className="h-4 w-full mb-2 bg-green-100" />
                          <Skeleton className="h-4 w-3/4 bg-green-100" />
                          <div className="flex items-center gap-1 mt-2">
                            <Skeleton className="h-3 w-3 rounded-full bg-green-100" />
                            <Skeleton className="h-3 w-24 bg-green-100" />
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md relative">
                          <p className="pr-8 text-green-900">{item.text}</p>
                          <div className="flex items-center text-xs text-green-700 mt-2">
                            <Clock className="h-3 w-3 mr-1 text-green-600" />
                            <span>{formatDate(item.timestamp)}</span>
                          </div>
                          <button
                            onClick={() => removeKnowledgeItem(item.id)}
                            className="absolute top-3 right-3"
                          >
                            <Trash2 className="h-4 w-4 text-green-600 hover:text-green-800" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator สำหรับ infinite scroll */}
                  <div ref={observerTarget} className="py-4">
                    {isLoadingMore && (
                      <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                          <KnowledgeItemSkeleton key={i} />
                        ))}
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
                  placeholder="เพิ่มข้อมูลลงในฐานข้อมูลของคุณ..."
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
                      เพิ่มลงในฐานข้อมูล
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
