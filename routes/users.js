const express = require("express");
const router = express.Router();
const knex = require("knex");
const config = require("../knexfile");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const db = knex(config.development);
require("dotenv").config();

function sendErrorMessage(res, statusCode, message) {
  res.status(statusCode).json({
    error: true,
    message: message,
  });
}

const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
  } else {
    return sendErrorMessage(res, 401, "Unauthorized: Token not present");
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.exp < Date.now() / 1000) {
      return sendErrorMessage(res, 401, "Unauthorized: Token has expired");
    }
    req.user = decoded;
    next();
  } catch (error) {
    sendErrorMessage(res, 401, "Unauthorized: Token is not valid");
  }
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendErrorMessage(res, 400, "Request body is incomplete - Email and Password required");
  }

  const queryUsers = await db.from("users").select("*").where("email", "=", email);
  if (queryUsers.length === 0) {
    return sendErrorMessage(res, 404, "User not found");
  }

  const user = queryUsers[0];
  const match = await bcrypt.compare(password, user.hash);
  if (!match) {
    return sendErrorMessage(res, 401, "Incorrect password");
  }

  const secretKey = process.env.SECRET_KEY;
  const expiresIn = 60 * 60 * 24 * 7;
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const token = jwt.sign({ id: user.id, email, exp }, secretKey);
  res.json({ token_type: "Bearer", token, expiresIn });
});

router.post(
  "/register",
  [check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorMessage(res, 400, errors.array());
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return sendErrorMessage(res, 400, "Request body is incomplete - Email and Password required");
    }

    const queryUsers = await db("users").select("*").where("email", "=", email);
    if (queryUsers.length > 0) {
      return sendErrorMessage(res, 400, "User already exists");
    }

    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    await db.from("users").insert({ email, hash });
    res.status(201).json({ success: true, message: "User created" });
  }
);

router.get("/:user_id", authorize, async (req, res) => {
  const { user_id } = req.params;
  try {
    const entries = await db("users")
      .select("id", "email", "name", "age", "height", "weight", "fitness_goal")
      .where("id", user_id);
    res.json(entries);
  } catch (error) {
    sendErrorMessage(res, 500, "Internal server error");
  }
});

// router.post(
//   "/",
//   authorize,
//   [
//     check("email").isEmail().withMessage("Email is not valid"),
//     check("name").not().isEmpty().withMessage("Name is required"),
//     check("age").isInt({ min: 0 }).withMessage("Age must be a positive integer"),
//     check("height").isFloat({ min: 0 }).withMessage("Height must be a positive number"),
//     check("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
//     const { password, email, name, age, height, weight, fitness_goal } = req.body;
//     try {
//       const existingUser = await db("users").where({ email }).first();
//       if (existingUser) {
//         return sendErrorMessage(res, 400, "Email already exists");
//       }

//       const saltRounds = 10;
//       const hash = bcrypt.hashSync(password, saltRounds);
//       const [id] = await db("users").insert({
//         email,
//         name,
//         age,
//         height,
//         weight,
//         fitness_goal,
//         hash,
//       });
//       const newUser = await db("users").where({ id }).first();
//       res.status(201).json(newUser);
//     } catch (error) {
//       sendErrorMessage(res, 500, "Internal server error");
//     }
//   }
// );

router.put(
  "/:user_id",
  authorize,
  [
    // check("password").notEmpty().withMessage("Password is required"),
    check("email").isEmail().withMessage("Email is not valid"),
    check("name").notEmpty().withMessage("Name is required"),
    check("age").isInt({ min: 0 }).withMessage("Age must be a positive integer"),
    check("height").isFloat({ min: 0 }).withMessage("Height must be a positive number"),
    check("weight").isFloat({ min: 0 }).withMessage("Weight must be a positive number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendErrorMessage(res, 400, errors.array());
    }

    const { user_id } = req.params;
    const { email, name, age, height, weight, fitness_goal } = req.body;
    try {
      const existingUser = await db("users").where("id", "<>", user_id).andWhere({ email: email }).first();
      if (existingUser && existingUser.email === email) {
        return sendErrorMessage(res, 400, "Email already exists");
      }
      const count = await db("users").where({ id: user_id }).update({
        email,
        name,
        age,
        height,
        weight,
        fitness_goal,
      });
      if (count > 0) {
        const updatedUser = await db("users")
          .select("id", "email", "name", "age", "height", "weight", "name", "fitness_goal")
          .where({ id: user_id })
          .first();
        res.status(200).json(updatedUser);
      } else {
        return sendErrorMessage(res, 400, "The user could not be found");
      }
    } catch (error) {
      return sendErrorMessage(res, 500, "Internal server error");
    }
  }
);

router.delete("/:user_id", authorize, [check("user_id").isInt().isNumeric()], async (req, res) => {
  const { user_id } = req.params;
  const errors = validationResult(req);

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  if (!errors.isEmpty()) {
    return sendErrorMessage(res, 400, errors.array());
  }
  try {
    const count = await db("users").where({ id: user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The user has been deleted" });
    } else {
      return sendErrorMessage(res, 404, "User not found");
    }
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.get("/:user_id/moods", authorize, [check("user_id").isInt().isNumeric()], async (req, res) => {
  const { user_id } = req.params;
  const errors = validationResult(req);

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  if (!errors.isEmpty()) {
    return sendErrorMessage(res, 400, errors.array());
  }

  try {
    const moods = await db("mood_entries").where({ user_id });
    res.status(200).json(moods);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:user_id/moods", authorize, [check("mood").not().isEmpty()], async (req, res) => {
  const { user_id } = req.params;
  const { mood, notes } = req.body;
  const errors = validationResult(req);

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  if (!errors.isEmpty()) {
    return sendErrorMessage(res, 400, errors.array());
  }
  try {
    const [id] = await db("mood_entries").insert({ user_id, mood, notes });
    const newEntry = await db("mood_entries").where({ id }).first();
    res.status(201).json(newEntry);
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.put("/:user_id/moods/:entry_id", authorize, [check("mood").not().isEmpty()], async (req, res) => {
  const { user_id, entry_id } = req.params;
  const { mood, notes } = req.body;
  const errors = validationResult(req);

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  if (!errors.isEmpty()) {
    return sendErrorMessage(res, 400, errors.array());
  }

  try {
    const count = await db("mood_entries").where({ id: entry_id, user_id }).update({ mood, notes });
    if (count > 0) {
      const updatedEntry = await db("mood_entries").where({ id: entry_id }).first();
      res.status(200).json(updatedEntry);
    } else {
      return sendErrorMessage(res, 404, "The mood entry could not be found");
    }
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.delete("/:user_id/moods/:entry_id", authorize, async (req, res) => {
  const { user_id, entry_id } = req.params;

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  try {
    const count = await db("mood_entries").where({ id: entry_id, user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The mood entry has been deleted" });
    } else {
      return sendErrorMessage(res, 404, "The mood entry could not be found");
    }
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.get("/:user_id/water_intake", authorize, async (req, res) => {
  const { user_id } = req.params;

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  try {
    const entries = await db("water_intake").where({ user_id });
    res.status(200).json(entries);
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.post(
  "/:user_id/water_intake",
  authorize,
  [
    check("amount").isNumeric().withMessage("Amount must be a number"),
    check("timestamp").isISO8601().withMessage("Timestamp must be a valid ISO 8601 date string"),
  ],
  async (req, res) => {
    const { user_id } = req.params;
    const { amount, timestamp } = req.body;
    const errors = validationResult(req);

    if (req.user.id !== parseInt(user_id)) {
      return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
    }

    if (!errors.isEmpty()) {
      return sendErrorMessage(res, 400, errors.array());
    }

    try {
      const [id] = await db("water_intake").insert({ user_id, amount, timestamp });
      const newEntry = await db("water_intake").where({ id }).first();
      res.status(201).json(newEntry);
    } catch (error) {
      return sendErrorMessage(res, 500, "Internal server error");
    }
  }
);

router.put(
  "/:user_id/water_intake/:entry_id",
  authorize,
  [
    check("amount").isNumeric().withMessage("Amount must be a number"),
    check("timestamp").isISO8601().withMessage("Timestamp must be a valid ISO 8601 date string"),
  ],
  async (req, res) => {
    const { user_id, entry_id } = req.params;
    const { amount } = req.body;
    const errors = validationResult(req);

    if (req.user.id !== parseInt(user_id)) {
      return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
    }

    if (!errors.isEmpty()) {
      return sendErrorMessage(res, 400, errors.array());
    }

    try {
      const count = await db("water_intake").where({ id: entry_id, user_id }).update({ amount });
      if (count > 0) {
        const updatedEntry = await db("water_intake").where({ id: entry_id }).first();
        res.status(200).json(updatedEntry);
      } else {
        return sendErrorMessage(res, 404, "The water intake entry could not be found");
      }
    } catch (error) {
      return sendErrorMessage(res, 500, "Internal server error");
    }
  }
);

router.delete("/:user_id/water_intake/:entry_id", authorize, async (req, res) => {
  const { user_id, entry_id } = req.params;

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  try {
    const count = await db("water_intake").where({ id: entry_id, user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The water intake entry has been deleted" });
    } else {
      return sendErrorMessage(res, 404, "The water intake entry could not be found");
    }
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.get("/:user_id/pedometer_entries", authorize, async (req, res) => {
  const { user_id } = req.params;

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  try {
    const entries = await db("pedometer_entries").where({ user_id });
    res.status(200).json(entries);
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

router.post(
  "/:user_id/pedometer_entries",
  authorize,
  [check("date").isISO8601().withMessage("Date must be a valid ISO 8601 date string")],
  async (req, res) => {
    const { user_id } = req.params;
    const { date, steps, distance } = req.body;
    const errors = validationResult(req);

    if (req.user.id !== parseInt(user_id)) {
      return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
    }

    if (!errors.isEmpty()) {
      return sendErrorMessage(res, 400, errors.array());
    }

    try {
      const [id] = await db("pedometer_entries").insert({ user_id, date, steps, distance });
      const newEntry = await db("pedometer_entries").where({ id }).first();
      res.status(201).json(newEntry);
    } catch (error) {
      return sendErrorMessage(res, 500, "Internal server error");
    }
  }
);

router.put(
  "/:user_id/pedometer_entries/:entry_id",
  authorize,
  [check("date").isISO8601().withMessage("Date must be a valid ISO 8601 date string")],
  async (req, res) => {
    const { user_id, entry_id } = req.params;
    const { date, steps, distance } = req.body;
    const errors = validationResult(req);

    if (req.user.id !== parseInt(user_id)) {
      return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
    }

    if (!errors.isEmpty()) {
      return sendErrorMessage(res, 400, errors.array());
    }

    try {
      const count = await db("pedometer_entries").where({ id: entry_id, user_id }).update({ date, steps, distance });
      if (count > 0) {
        const updatedEntry = await db("pedometer_entries").where({ id: entry_id }).first();
        res.status(200).json(updatedEntry);
      } else {
        return sendErrorMessage(res, 404, "The pedometer entry could not be found");
      }
    } catch (error) {
      return sendErrorMessage(res, 500, "Internal server error");
    }
  }
);

router.delete("/:user_id/pedometer_entries/:entry_id", authorize, async (req, res) => {
  const { user_id, entry_id } = req.params;

  if (req.user.id !== parseInt(user_id)) {
    return sendErrorMessage(res, 403, "Forbidden: You can only access your account");
  }

  try {
    const count = await db("pedometer_entries").where({ id: entry_id, user_id }).del();
    if (count > 0) {
      res.status(200).json({ message: "The pedometer entry has been deleted" });
    } else {
      return sendErrorMessage(res, 404, "The pedometer entry could not be found");
    }
  } catch (error) {
    return sendErrorMessage(res, 500, "Internal server error");
  }
});

module.exports = router;
