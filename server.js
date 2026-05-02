import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { loadAndChunkPDF } from "./rag/loader.js";
import { buildVectorStore, searchVectorStore } from "./rag/vectorstore.js";
import { askClaude } from "./rag/llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "uploads/" });

let currentVectorStore = null;
let currentFileName = null;

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    console.log(`PDF received: ${req.file.originalname}`);

    const chunks = await loadAndChunkPDF(req.file.path);
    console.log(`Split into ${chunks.length} chunks`);

    currentVectorStore = await buildVectorStore(chunks);
    currentFileName = req.file.originalname;

    console.log(`Vector store ready for: ${currentFileName}`);
    res.json({
      message: `PDF "${currentFileName}" loaded! You can now ask questions.`,
      chunks: chunks.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Please provide a question." });
    }

    if (!currentVectorStore) {
      return res.status(400).json({ error: "No PDF loaded. Please upload a PDF first." });
    }

    console.log(`Question: ${question}`);

    const relevantChunks = await searchVectorStore(currentVectorStore, question);
    console.log(`Found ${relevantChunks.length} relevant chunks`);

    const answer = await askClaude(question, relevantChunks);

    res.json({ answer, source: currentFileName });
  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/status", (req, res) => {
  res.json({
    status: "running",
    pdfLoaded: !!currentVectorStore,
    fileName: currentFileName || "none",
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});