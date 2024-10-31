const fs = require("fs");
const path = require("path");

const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const jimp = require("jimp");

const User = require("../../service/models/user.js");
const JwtAuthMiddleware = require("../../middleware/auth.js");
const generateAvatarURL = require("../../service/models/avatar.js");
const upload = require("../../middleware/upload.js");
const mg = require("../../config.js");

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
  verify: Joi.boolean().default(false),
  verificationToken: Joi.string().optional(),
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
      verify: false,
    });

    await newUser.save();

    const data = {
      from: `My App <${process.env.MG_FROM_EMAIL}>`,
      to: email,
      subject: "Email Verification",
      text: `Please verify your email by clicking the following link: http://localhost:8000/api/users/verify/${newUser.verificationToken}`,
    };

    mg.messages().send(data, (error, body) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email", error });
      }
      console.log("Email sent:", body);
      res.status(200).json({ message: "Verification email sent" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/users/verify", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "missing required field email" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.verify) {
    return res
      .status(400)
      .json({ message: "Verification has already been passed" });
  }

  const data = {
    from: `My App <${process.env.MG_FROM_EMAIL}>`,
    to: email,
    subject: "Email Verification",
    text: `Please verify your email by clicking the following link: http://localhost:8000/api/users/verify/${user.verificationToken}`,
  };

  mg.messages().send(data, (error, body) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Error sending email", error });
    }
    console.log("Email sent:", body);
    res.status(200).json({ message: "Verification email sent" });
  });
});

router.get("/users/verify/:verificationToken", async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
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

// router.use(JwtAuthMiddleware);

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
