const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { notFound, errorHandler } = require("./middleware/error");
const connectDB = require("./db");
const { join } = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const fileRouter = require("./routes/file");
const notificationRouter = require("./routes/notification");
const boardsRouter = require("./routes/board");
const columnsRouter = require("./routes/column");
const cardsRouter = require("./routes/card");
const newBoardRouter = require("./controllers/newBoard");

const { json, urlencoded } = express;

connectDB();
const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("connected");
});

if (process.env.NODE_ENV === "development") {
  app.use(logger("dev"));
}
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "https://kanban-rambo.vercel.app",
    ],
  })
);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/files", fileRouter);
app.use("/notifications/", notificationRouter);
app.use("/dashboard/boards", boardsRouter);
app.use("/dashboard/boards/", columnsRouter);
app.use("/dashboard/boards/", cardsRouter);
app.use("/newboard", newBoardRouter);

// All routes will need to change to accomodate production use
// Changes need to occur in client side repo
if (process.env.NODE_ENV === "production") {
  // app.use(express.static(path.join(__dirname, "/client/build")));
  // res.sendFile(path.resolve(__dirname), "client", "build", "index.html")

  app.get("*", (req, res) => res.send("API is running in production"));
} else {
  app.get("/", (req, res) => {
    res.send("API is running");
  });
}

app.use(notFound);
app.use(errorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server };
