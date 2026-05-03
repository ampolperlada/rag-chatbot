import pdfParse from "pdf-parse/lib/pdf-parse.js";
import fs from "fs";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export async function loadAndChunkPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);

  const fullText = pdfData.text;
  console.log(`Extracted ${fullText.length} characters from PDF`);

  const chunks = splitIntoChunks(fullText, CHUNK_SIZE, CHUNK_OVERLAP);
  return chunks;
}

function splitIntoChunks(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 10) {
      chunks.push({
        content: chunk,
        index: chunks.length,
      });
    }

    start += chunkSize - overlap;
  }

  return chunks;
}