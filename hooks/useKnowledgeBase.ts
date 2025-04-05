import { useState } from "react";
import { KnowledgeItem } from "@/types";

export function useKnowledgeBase() {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
          setKnowledgeBase((prev) => [...prev, ...data.documents]);
        }
        setHasMore(data.documents.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    knowledgeBase,
    isLoadingMore,
    hasMore,
    page,
    setPage,
    fetchKnowledgeBase,
  };
}
