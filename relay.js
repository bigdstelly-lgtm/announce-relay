const express = require("express");
const app = express();
app.use(express.json());

const API_KEY = "gardentrenchesadmin52932";
const queue = [];

function checkKey(req, res) {
  if (req.headers["x-api-key"] !== API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

app.post("/announce", (req, res) => {
  if (!checkKey(req, res)) return;
  const { message, type, author } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  queue.push({ message, type: type ?? "general", author: author ?? "Discord" });
  res.json({ ok: true });
});

app.get("/poll", (req, res) => {
  if (!checkKey(req, res)) return;
  const pending = queue.splice(0, queue.length);
  res.json({ pending });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relay running on port ${PORT}`));
