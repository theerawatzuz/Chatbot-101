import { Message } from "@/types";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
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
  );
}
