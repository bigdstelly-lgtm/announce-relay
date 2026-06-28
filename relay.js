const express = require("express");
const app = express();
app.use(express.json());

const API_KEY = "gardentrenchesadmin52932";
const announceQueue = [];
const alertQueue = [];
const serverRegistry = {};

let cachedStock = { stock: {}, nextRestock: null };

function checkKey(req, res) {
  if (req.headers["x-api-key"] !== API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// Roblox game POSTs player list + server ID every 30s
app.post("/heartbeat", (req, res) => {
  if (!checkKey(req, res)) return;
  const { jobId, players } = req.body;
  if (!jobId) return res.status(400).json({ error: "jobId required" });
  serverRegistry[jobId] = { players: players ?? [], lastSeen: Date.now() };
  res.json({ ok: true });
});

// Bot queries this to find which server a player is in
app.get("/findplayer", (req, res) => {
  if (!checkKey(req, res)) return;
  const username = req.query.username?.toLowerCase();
  if (!username) return res.status(400).json({ error: "username required" });
  const now = Date.now();
  for (const jobId of Object.keys(serverRegistry)) {
    if (now - serverRegistry[jobId].lastSeen > 120000) delete serverRegistry[jobId];
  }
  for (const [jobId, data] of Object.entries(serverRegistry)) {
    const found = data.players.find(p => p.toLowerCase() === username);
    if (found) return res.json({ jobId, found: true });
  }
  res.json({ jobId: null, found: false });
});

// Discord bot POSTs announcements
app.post("/announce", (req, res) => {
  if (!checkKey(req, res)) return;
  const { message, type, author, robloxUsername } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  announceQueue.push({ message, type: type ?? "general", author: author ?? "Discord", robloxUsername: robloxUsername ?? "" });
  res.json({ ok: true });
});

// Roblox polls for announcements
app.get("/poll", (req, res) => {
  if (!checkKey(req, res)) return;
  const pending = announceQueue.splice(0, announceQueue.length);
  res.json({ pending });
});

// Roblox POSTs anticheat/alt alerts
app.post("/alert", (req, res) => {
  if (!checkKey(req, res)) return;
  const { alertType, userId, username, details } = req.body;
  if (!alertType || !userId) return res.status(400).json({ error: "alertType and userId required" });
  alertQueue.push({ alertType, userId, username, details, timestamp: Date.now() });
  res.json({ ok: true });
});

// Bot polls for alerts
app.get("/alerts", (req, res) => {
  if (!checkKey(req, res)) return;
  const pending = alertQueue.splice(0, alertQueue.length);
  res.json({ pending });
});

// Roblox POSTs stock data after every restock
app.post("/stock", (req, res) => {
  if (!checkKey(req, res)) return;
  const { stock, nextRestockAt } = req.body;
  cachedStock = { stock, nextRestockAt };
  res.json({ ok: true });
});

// Bot polls this every 30s to update the Discord embed
app.get("/stock", (req, res) => {
  if (!checkKey(req, res)) return;
  res.json(cachedStock);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relay running on port ${PORT}`));
