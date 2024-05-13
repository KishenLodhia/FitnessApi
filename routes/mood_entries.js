const express = require("express");
const router = express.Router();
const knex = require("knex");
const config = require("../knexfile");

const db = knex(config.development);

// get all mood entries for a user
router.get("/", async (req, res) => {
  const { user_id } = req.body;
  try {
    const entries = await db("mood_entries").where("user_id", user_id);
    res.json(entries);
  } catch (error) {
    console.error("Error fetching mood entries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add mood data
router.post("/add_mood", async (req, res) => {
  const { user_id, mood, notes } = req.body;

  if (user_id == null || mood == null) res.status(401).json({ error: "Invalid format" });
  try {
    const newEntry = await db("mood_entries").insert({ user_id, mood, notes });
    res.json({ id: newEntry[0], user_id, mood });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
