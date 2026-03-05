const config = require("./utils/config");
const logger = require("./utils/logger");
const express = require("express");
const mongoose = require("mongoose");
const blogRouter = require("./controllers/blogs");
const userRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const {
  unknownEndpoint,
  errorHandler,
  requestLogger,
  tokenExtractor,
  userExtractor,
} = require("./utils/middleware");

const app = express();

mongoose
  .connect(config.MONGODB_URI, { family: 4 })
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB:", error.message);
  });

app.use(express.json());
app.use(requestLogger);
app.use(tokenExtractor);
app.use("/api/login", loginRouter);
app.use("/api/blogs", userExtractor, blogRouter);
app.use("/api/users", userRouter);
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
