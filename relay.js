const express = require("express");
const app = express();
app.use(express.json());

const API_KEY = "gardentrenchesadmin52932";
const announceQueue = [];
const alertQueue = [];

function checkKey(req, res) {
  if (req.headers["x-api-key"] !== API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// Discord bot POSTs here to queue an announcement
app.post("/announce", (req, res) => {
  if (!checkKey(req, res)) return;
  const { message, type, author, robloxUsername } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  announceQueue.push({ message, type: type ?? "general", author: author ?? "Discord", robloxUsername: robloxUsername ?? "" });
  res.json({ ok: true });
});

// Roblox polls this for announcements
app.get("/poll", (req, res) => {
  if (!checkKey(req, res)) return;
  const pending = announceQueue.splice(0, announceQueue.length);
  res.json({ pending });
});

// Roblox POSTs anticheat/alt alerts here
app.post("/alert", (req, res) => {
  if (!checkKey(req, res)) return;
  const { alertType, userId, username, details } = req.body;
  if (!alertType || !userId) return res.status(400).json({ error: "alertType and userId required" });
  alertQueue.push({ alertType, userId, username, details, timestamp: Date.now() });
  res.json({ ok: true });
});

// Discord bot polls this for alerts
app.get("/alerts", (req, res) => {
  if (!checkKey(req, res)) return;
  const pending = alertQueue.splice(0, alertQueue.length);
  res.json({ pending });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relay running on port ${PORT}`));
