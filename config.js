const mailgun = require("mailgun-js");

const dotenv = require("dotenv");

dotenv.config();

const DOMAIN = process.env.MG_DOMAIN;
const API_KEY = process.env.MG_KEY;

const mg = mailgun({ apiKey: API_KEY, domain: DOMAIN });

module.exports = mg;
