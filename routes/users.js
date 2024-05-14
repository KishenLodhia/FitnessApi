const express = require("express");
const router = express.Router();
const knex = require("knex");
const config = require("../knexfile");
const { check, validationResult } = require("express-validator");

const db = knex(config.development);

// get all mood entries for a user
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const entries = await db("users")
      .select("id", "username", "email", "name", "age", "height", "weight", "fitness_goal")
      .where("id", user_id);
    res.json(entries);
  } catch (error) {
    console.error("Error fetching mood entries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add a new user
router.post(
  "/",
  [
    check("username").isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    check("email").isEmail().withMessage("Email is not valid"),
    check("name").not().isEmpty().withMessage("Name is required"),
    check("age")
      .not()
      .isEmpty()
      .withMessage("Age is required")
      .bail()
      .isInt({ min: 0 })
      .withMessage("Age must be a positive integer"),
    check("height").isFloat({ min: 0 }).withMessage("Height must be a positive number"),
    check("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password, email, name, age, height, weight, fitness_goal } = req.body;
    try {
      const existingUser = await db("users").where({ username }).orWhere({ email }).first();
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const [id] = await db("users").insert({
        username,
        password,
        email,
        name,
        age,
        height,
        weight,
        fitness_goal,
      });
      const newUser = await db("users").where({ id }).first();
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error adding new user:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }
);

// update a user
router.put(
  "/:user_id",
  [
    check("username").notEmpty().withMessage("Username is required"),
    check("password").notEmpty().withMessage("Password is required"),
    check("email").isEmail().withMessage("Email is not valid"),
    check("name").notEmpty().withMessage("Name is required"),
    check("age").isInt({ min: 0 }).withMessage("Age must be a positive integer"),
    check("height").isFloat({ min: 0 }).withMessage("Height must be a positive number"),
    check("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user_id } = req.params;
    const { username, password, email, name, age, height, weight, fitness_goal } = req.body;
    try {
      const existingUser = await db("users")
        .where("id", "<>", user_id)
        .andWhere({ username })
        .orWhere({ email })
        .first();
      if (existingUser) {
        if (existingUser.username === username) {
          return res.status(400).json({ error: "Username already exists" });
        }
        if (existingUser.email === email) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      const count = await db("users").where({ id: user_id }).update({
        username,
        password,
        email,
        name,
        age,
        height,
        weight,
        fitness_goal,
      });
      if (count > 0) {
        const updatedUser = await db("users").where({ id: user_id }).first();
        res.status(200).json(updatedUser);
      } else {
        res.status(404).json({ message: "The user could not be found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// delete a user
router.delete("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const count = await db("users").where({ id: user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The user has been deleted" });
    } else {
      res.status(404).json({ message: "The user could not be found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get User's Mood Entries
router.get("/:user_id/moods", async (req, res) => {
  const { user_id } = req.params;
  try {
    const moods = await db("mood_entries").where({ user_id });
    res.status(200).json(moods);
  } catch (error) {
    console.error("Error fetching moods:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add Mood Entry for User
router.post("/:user_id/moods", async (req, res) => {
  const { user_id } = req.params;
  const { mood, notes } = req.body;
  try {
    const [id] = await db("mood_entries").insert({ user_id, mood, notes });
    const newEntry = await db("mood_entries").where({ id }).first();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error adding mood entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Mood Entry for User
router.put("/:user_id/moods/:entry_id", async (req, res) => {
  const { user_id, entry_id } = req.params;
  const { mood, notes } = req.body;
  try {
    const count = await db("mood_entries").where({ id: entry_id, user_id }).update({ mood, notes });
    if (count > 0) {
      const updatedEntry = await db("mood_entries").where({ id: entry_id }).first();
      res.status(200).json(updatedEntry);
    } else {
      res.status(404).json({ message: "The mood entry could not be found" });
    }
  } catch (error) {
    console.error("Error updating mood entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Mood Entry for User
router.delete("/:user_id/moods/:entry_id", async (req, res) => {
  const { user_id, entry_id } = req.params;
  try {
    const count = await db("mood_entries").where({ id: entry_id, user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The mood entry has been deleted" });
    } else {
      res.status(404).json({ message: "The mood entry could not be found" });
    }
  } catch (error) {
    console.error("Error deleting mood entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Water Intake Entries for User
router.get("/:user_id/water_intake", async (req, res) => {
  const { user_id } = req.params;
  try {
    const entries = await db("water_intake").where({ user_id });
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching water intake entries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add Water Intake Entry for User
router.post("/:user_id/water_intake", async (req, res) => {
  const { user_id } = req.params;
  const { amount, timestamp } = req.body;
  try {
    const [id] = await db("water_intake").insert({ user_id, amount, timestamp });
    const newEntry = await db("water_intake").where({ id }).first();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error adding water intake entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Water Intake Entry for User
router.put("/:user_id/water_intake/:entry_id", async (req, res) => {
  const { user_id, entry_id } = req.params;
  const { amount } = req.body;
  try {
    const count = await db("water_intake").where({ id: entry_id, user_id }).update({ amount });
    if (count > 0) {
      const updatedEntry = await db("water_intake").where({ id: entry_id }).first();
      res.status(200).json(updatedEntry);
    } else {
      res.status(404).json({ message: "The water intake entry could not be found" });
    }
  } catch (error) {
    console.error("Error updating water intake entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Water Intake Entry for User
router.delete("/:user_id/water_intake/:entry_id", async (req, res) => {
  const { user_id, entry_id } = req.params;
  try {
    const count = await db("water_intake").where({ id: entry_id, user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The water intake entry has been deleted" });
    } else {
      res.status(404).json({ message: "The water intake entry could not be found" });
    }
  } catch (error) {
    console.error("Error deleting water intake entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Pedometer Entries for User
router.get("/:user_id/pedometer_entries", async (req, res) => {
  const { user_id } = req.params;
  try {
    const entries = await db("pedometer_entries").where({ user_id });
    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching pedometer entries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add Pedometer Entry for User
router.post("/:user_id/pedometer_entries", async (req, res) => {
  const { user_id } = req.params;
  const { date, steps, distance } = req.body;
  try {
    const [id] = await db("pedometer_entries").insert({ user_id, date, steps, distance });
    const newEntry = await db("pedometer_entries").where({ id }).first();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error adding pedometer entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Pedometer Entry for User
router.put("/:user_id/pedometer_entries/:entry_id", async (req, res) => {
  const { user_id, entry_id } = req.params;
  const { date, steps, distance } = req.body;
  try {
    const count = await db("pedometer_entries").where({ id: entry_id, user_id }).update({ date, steps, distance });
    if (count > 0) {
      const updatedEntry = await db("pedometer_entries").where({ id: entry_id }).first();
      res.status(200).json(updatedEntry);
    } else {
      res.status(404).json({ message: "The pedometer entry could not be found" });
    }
  } catch (error) {
    console.error("Error updating pedometer entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Pedometer Entry for User
router.delete("/:user_id/pedometer_entries/:entry_id", async (req, res) => {
  const { user_id, entry_id } = req.params;
  try {
    const count = await db("pedometer_entries").where({ id: entry_id, user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The pedometer entry has been deleted" });
    } else {
      res.status(404).json({ message: "The pedometer entry could not be found" });
    }
  } catch (error) {
    console.error("Error deleting pedometer entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
