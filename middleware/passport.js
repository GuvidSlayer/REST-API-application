const passport = require("passport");
const User = require("../service/models/user.js");
const { ExtractJwt, Strategy: JwtStrategy } = require("passport-jwt");

function JWTStrategy() {
  const secret = process.env.SECRET;
  const params = {
    secretOrKey: secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  };
  passport.use(
    new JwtStrategy(params, async (jwtPayload, done) => {
      try {
        const user = await User.findById(jwtPayload.user_id);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}

module.exports = JWTStrategy;
