const jwt = require("jsonwebtoken");

/* const payload = {
  id: "some_id",
  username: "some_username",
}; */

const secret = process.env.SECRET;

// const token = jwt.sign(payload, secret, { expiresIn: "12h" });

// console.log(token);

const originalToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InNvbWVfaWQiLCJ1c2VybmFtZSI6InNvbWVfdXNlcm5hbWUiLCJpYXQiOjE1MTYyMzkwMjJ9.oelOeqTIm7Bjpn6_YBEU-WHqk9fVVXU4QJaOmALZnq0";

/* const secondToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InNvbWVfaWQiLCJ1c2VybmFtZSI6InNvbWVfdXNlcm5hbWUiLCJhZG1pbiI6InRydWUiLCJpYXQiOjE3MjA5NjcyNDgsImV4cCI6MTcyMTAxMDQ0OH0.xO94EHuzaNEQM_WY_QV8248ccC27Ep4qwk9gP7Pa_qw"; */

try {
  const verified = jwt.verify(originalToken, secret);
  console.log("Verified token data:", verified);
} catch (error) {
  console.log("Token verification error:", error.message);
}
