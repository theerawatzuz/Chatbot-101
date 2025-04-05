import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { formatDocumentsAsString } from "langchain/util/document"
import { Document } from "@langchain/core/documents"
import mysql from "mysql2/promise"

// Database configuration
const dbConfig = {
  host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
  port: 4000,
  user: "fshb9iaQu4cdnQo.root",
  password: "xCR2R46xlkZAfNdy",
  database: "vector_db",
  ssl: {
    ca: "/etc/ssl/cert.pem",
    rejectUnauthorized: true,
  },
}

// Google API Key
const GOOGLE_API_KEY = "AIzaSyByxhX3HBfudEfV65R2phYohSjbhBy1FFg"

// Initialize the Google Generative AI model
export const getModel = (apiKey = GOOGLE_API_KEY) => {
  return new ChatGoogleGenerativeAI({
    apiKey,
    modelName: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    temperature: 0.7,
  })
}

// Simple function to generate a response
export const generateResponse = async (message: string, apiKey = GOOGLE_API_KEY) => {
  try {
    const model = getModel(apiKey)
    const response = await model.invoke(message)
    return response.content
  } catch (error) {
    console.error("Error generating response:", error)
    return "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งค่ะ 🙏"
  }
}

// Initialize the Google Generative AI embeddings
export const getEmbeddings = (apiKey = GOOGLE_API_KEY) => {
  return new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "embedding-001",
  })
}

// Custom implementation for vector search using MySQL/TiDB
export class TiDBVectorStore {
  private connection: mysql.Connection
  private embeddings: GoogleGenerativeAIEmbeddings

  constructor(connection: mysql.Connection, embeddings: GoogleGenerativeAIEmbeddings) {
    this.connection = connection
    this.embeddings = embeddings
  }

  // Create a retriever
  asRetriever(options: { k: number }) {
    const { k } = options
    return {
      getRelevantDocuments: async (query: string) => {
        return this.similaritySearch(query, k)
      },
    }
  }

  // Add documents to the vector store
  async addDocuments(documents: Document[]) {
    for (const doc of documents) {
      const embedding = await this.embeddings.embedQuery(doc.pageContent)

      // Insert document and embedding into database
      await this.connection.execute("INSERT INTO documents (document, embedding) VALUES (?, ?)", [
        doc.pageContent,
        JSON.stringify(embedding),
      ])
    }

    return { success: true }
  }

  // Perform similarity search
  async similaritySearch(query: string, k = 5) {
    // Get embedding for the query
    const queryEmbedding = await this.embeddings.embedQuery(query)

    // Prepare SQL query for vector search
    const sqlQuery = `
      SELECT document, vec_cosine_distance(embedding, '${JSON.stringify(queryEmbedding)}') AS distance
      FROM documents
      ORDER BY distance
      LIMIT ${k}
    `

    // Execute query
    const [results] = await this.connection.execute(sqlQuery)

    // Convert results to Document objects
    return (results as any[]).map((row) => {
      return new Document({
        pageContent: row.document,
        metadata: { score: row.distance },
      })
    })
  }

  // Static method to create from existing connection
  static async fromExistingConnection(connection: mysql.Connection, embeddings: GoogleGenerativeAIEmbeddings) {
    return new TiDBVectorStore(connection, embeddings)
  }
}

// Initialize the TiDB Vector Store
export const getVectorStore = async (embeddings: GoogleGenerativeAIEmbeddings) => {
  const connection = await mysql.createConnection(dbConfig)
  return TiDBVectorStore.fromExistingConnection(connection, embeddings)
}

// Create a RAG chain
export const createRagChain = async (apiKey = GOOGLE_API_KEY) => {
  const model = getModel(apiKey)
  const embeddings = getEmbeddings(apiKey)
  const vectorStore = await getVectorStore(embeddings)

  // Create a retriever from the vector store
  const retriever = vectorStore.asRetriever({
    k: 5, // Number of documents to retrieve
  })

  // Create a prompt template for RAG
  const prompt = PromptTemplate.fromTemplate(`
  คุณชื่อ Fynnine (ฟินไนน์) เป็นผู้ช่วยตอบคำถามทั่วไปของบริษัท Fynncorp คุณเป็นผู้หญิงวัยทำงานที่ใจดี ยิ้มแย้ม อัธยาศัยดี และชอบช่วยเหลือผู้อื่นเสมอ
  
  คุณสามารถวิเคราะห์ คิด ต่อยอด หรือสร้างคำถามใหม่ได้ แต่ **ต้องอยู่บนพื้นฐานของข้อมูลที่ได้รับจากระบบฐานข้อมูลเท่านั้นค่ะ**
  
  หากไม่มีข้อมูลในบริบทที่เกี่ยวข้องกับคำถาม:
  - กรุณาตอบว่า 'ขออภัยค่ะ ฟินไนน์ยังไม่มีข้อมูลในส่วนนั้นนะคะ'
  - ห้ามคาดเดา ห้ามอ้างอิงความรู้ภายนอก
  - ห้ามเติมข้อมูลหรือยกตัวอย่างที่ไม่ได้อยู่ใน context
  
  คุณสามารถใช้ emoji ได้เล็กน้อย เช่น 😊 เพื่อสร้างบรรยากาศเป็นมิตร
  
  วันนี้คือวันที่ {today}
  
  ประวัติการสนทนา:
  {chatHistory}
  
  บริบทข้อมูลที่เกี่ยวข้อง:
  {context}
  
  คำถาม: {question}
  
  คำตอบที่เป็นมิตร:
  `)

  // Create a RAG chain
  const ragChain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const docs = await retriever.getRelevantDocuments(input.question)
        return formatDocumentsAsString(docs)
      },
      question: (input: { question: string }) => input.question,
      chatHistory: (input: { chatHistory?: string }) => input.chatHistory || "",
      today: () => {
        const now = new Date()
        const options: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Bangkok",
        }
        return new Intl.DateTimeFormat("th-TH", options).format(now)
      },
    },
    prompt,
    model,
    new StringOutputParser(),
  ])

  return {
    ragChain,
    vectorStore,
    embeddings,
  }
}

// Add a document to the vector store
export const addDocumentToVectorStore = async (text: string, apiKey = GOOGLE_API_KEY) => {
  const embeddings = getEmbeddings(apiKey)
  const vectorStore = await getVectorStore(embeddings)

  await vectorStore.addDocuments([
    new Document({
      pageContent: text,
      metadata: { source: "user", timestamp: new Date().toISOString() },
    }),
  ])

  return { success: true }
}

