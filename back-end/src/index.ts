import express from "express";
import { Server, FileStore } from "tus-node-server";
import path from "path";
import cors from "cors";
import fs from "fs";

const UPLOAD_DIR = path.resolve(__dirname, "uploads");
const METADATA_DIR = path.resolve(__dirname, "metadata");

[UPLOAD_DIR, METADATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const server = new Server({ path: "/files" });
server.datastore = new FileStore({ directory: UPLOAD_DIR });

const app = express();
app.use(cors());

const parseMetadata = (metadataHeader: string): Record<string, string> => {
  const metadata: Record<string, string> = {};
  metadataHeader.split(",").forEach((pair) => {
    const [key, value] = pair.split(" ");
    if (key && value) {
      metadata[key] = Buffer.from(value, "base64").toString("utf-8");
    }
  });
  return metadata;
};

app.post("/files/*", (req, res, next) => {
  const metadataHeader = req.headers["upload-metadata"];
  if (metadataHeader && typeof metadataHeader === "string") {
    const metadata = parseMetadata(metadataHeader);
    const fileId = req.headers["upload-length"] || Date.now().toString();
    const metadataPath = path.join(METADATA_DIR, `${fileId}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(" Metadata saved at:", metadataPath);
  }
  next();
});

app.all("/files/*", (req, res) => {
  server.handle(req, res);
});

const PORT = 1080;
app.listen(PORT, () => {
  console.log(`Tus server is running at: http://localhost:${PORT}/files/`);
});
