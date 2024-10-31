const gravatar = require("gravatar");

const generateAvatarURL = (email) => {
  return gravatar.url(email, { s: "250", r: "pg", d: "mm" });
};

module.exports = generateAvatarURL;
