import { connectDB } from "./db";
import { createEmbedding } from "./embeddings";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

interface Document extends RowDataPacket {
  id: number;
  text: string;
  timestamp: Date;
}

interface LatestDate extends RowDataPacket {
  latest_date: Date;
}

export async function getDocuments(page: number, limit: number) {
  const connection = await connectDB();
  try {
    const offset = (page - 1) * limit;

    const [documents] = await connection.execute<Document[]>(
      `SELECT id, document as text, created_at as timestamp 
       FROM documents 
       ORDER BY created_at DESC 
       LIMIT ${limit} OFFSET ${offset}`
    );

    const [latestDate] = await connection.execute<LatestDate[]>(
      "SELECT MAX(created_at) as latest_date FROM documents"
    );

    return {
      documents,
      latestDate: latestDate[0]?.latest_date || new Date(),
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function ment(text: string) {
  const connection = await connectDB();
  try {
    const embedding = await createEmbedding(text);
    const [result] = await connection.execute<ResultSetHeader>(
      "INSERT INTO documents (document, embedding) VALUES (?, ?)",
      [text, embedding]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function deleteDocument(id: string) {
  const connection = await connectDB();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM documents WHERE id = ?",
      [id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function queryDocuments(queryText: string, k = 5) {
  const connection = await connectDB();
  try {
    const queryEmbedding = await createEmbedding(queryText);
    const [rows] = await connection.execute(
      `
      SELECT document, vec_cosine_distance(embedding, ?) AS distance
      FROM documents
      ORDER BY distance
      LIMIT ?
    `,
      [queryEmbedding, k]
    );
    return rows;
  } catch (error) {
    console.error("Query error:", error);
    return [];
  } finally {
    await connection.end();
  }
}

export async function queryTiDB(queryText: string, k = 5) {
  const connection = await connectDB();
  try {
    const queryEmbedding = await createEmbedding(queryText);

    const sql_query = `
      SELECT document, vec_cosine_distance(embedding, '${queryEmbedding}') AS distance
      FROM documents
      ORDER BY distance
      LIMIT ${k}
    `;

    const [rows] = await connection.execute(sql_query);
    return rows;
  } catch (error) {
    console.error("Query error:", error);
    return [];
  } finally {
    await connection.end();
  }
}
