// Database configuration
export const dbConfig = {
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

// API configuration
export const apiConfig = {
  geminiApiKey: "AIzaSyByxhX3HBfudEfV65R2phYohSjbhBy1FFg",
  pythonBackendUrl: "http://your-python-backend-url", // Replace with your actual Python backend URL
}

