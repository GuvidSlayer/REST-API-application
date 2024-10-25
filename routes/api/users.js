const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const User = require("../../service/models/user.js");
const JwtAuthMiddleware = require("../../middleware/auth.js");
const dotenv = require("dotenv");
const generateAvatarURL = require("../../service/models/avatar.js");
const upload = require("../../middleware/upload.js");
const path = require("path");
const jimp = require("jimp");
const fs = require("fs");

dotenv.config();

const router = express.Router();

const userSchema = Joi.object({
  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
  subscription: Joi.string()
    .valid("starter", "pro", "business")
    .default("starter"),
  token: Joi.string().allow(null).default(null),
  avatarURL: Joi.string().uri().optional(),
});

router.post("/users/register", async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation error", error });
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const avatarURL = generateAvatarURL(email);

    const newUser = new User({
      email,
      password: hashedPassword,
      subscription: "starter",
      avatarURL,
    });

    await newUser.save();

    res
      .status(201)
      .json({ user: { email, subscription: newUser.subscription, avatarURL } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation error", error });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ user_id: user._id, email }, process.env.SECRET, {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: { email, subscription: user.subscription },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/users/logout", JwtAuthMiddleware(), async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/users/current", JwtAuthMiddleware(), (req, res) => {
  res.status(200).json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

router.patch(
  "/users/avatars",
  JwtAuthMiddleware(),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { path: tempPath, originalname } = req.file;
      const newFileName = `${req.user.id}-${originalname}`;
      const targetPath = path.join(
        __dirname,
        "../../public/avatars",
        newFileName
      );

      const image = await jimp.read(tempPath);
      await image.resize(250, 250).writeAsync(targetPath);

      fs.unlinkSync(tempPath);

      req.user.avatarURL = `/avatars/${newFileName}`;
      await req.user.save();

      res.status(200).json({ avatarURL: req.user.avatarURL });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

module.exports = router;
