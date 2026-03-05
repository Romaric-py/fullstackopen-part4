const config = require("../utils/config");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const loginRouter = require("express").Router();

loginRouter.post("/", async (request, response) => {
  if (!request.body.username || !request.body.password) {
    return response
      .status(400)
      .json({ error: "username and password are required" });
  }

  const { username, password } = request.body;

  const user = await User.findOne({ username });
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return response.status(401).json({ error: "invalid username or password" });
  }

  const tokenPayload = {
    username: user.username,
    id: user._id,
  };
  const token = jwt.sign(tokenPayload, config.SECRET, { expiresIn: 60 * 60 });

  response.json({ username: user.username, name: user.name, token });
});

module.exports = loginRouter;
