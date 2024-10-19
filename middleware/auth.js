const passport = require("passport");

function JwtAuthMiddleware() {
  return passport.authenticate("jwt", { session: false });
}

module.exports = JwtAuthMiddleware;
