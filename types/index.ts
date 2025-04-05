export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface KnowledgeItem {
  id: string;
  text: string;
  timestamp: Date;
}
