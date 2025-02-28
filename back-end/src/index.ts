import express from "express";
import { Server, FileStore } from "tus-node-server";

import path from "path";
import cors from "cors";
import fs from "fs";

const UPLOAD_DIR = path.resolve(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const server = new Server({
    path: '/files'
})
server.datastore = new FileStore({ directory: UPLOAD_DIR });
const app = express();
app.use(cors());

app.all("/files/*", (req, res) => {
    server.handle(req, res);
});

const PORT = 1080;
app.listen(PORT, () => {
  console.log(` Tus server is running on http://localhost:${PORT}/files/`);
  console.log(` Files will be saved in: ${UPLOAD_DIR}`);
});
