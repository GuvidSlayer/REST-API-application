const express = require("express");
const passport = require("passport");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const apiRouter = require("./routes/api/contacts.js");
const usersRouter = require("./routes/api/users.js");
const dotenv = require("dotenv");
const JWTStrategy = require("./middleware/passport.js");
const JwtAuthMiddleware = require("./middleware/auth.js");

dotenv.config();

const { DB_HOST: urlDb } = process.env;
const PORT = process.env.MAIN_PORT;

console.log(urlDb);
const connection = mongoose.connect(urlDb);

const app = express();

app.use(passport.initialize());

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

JWTStrategy();

app.use("/api", usersRouter);
app.use("/api", JwtAuthMiddleware(), apiRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Not found - ${req.path}` });
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  } else {
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

const startServer = async () => {
  try {
    await connection;
    console.log("Database connected");
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

startServer();
