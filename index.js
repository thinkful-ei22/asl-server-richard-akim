"use strict";

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");

const { PORT, CLIENT_ORIGIN } = require("./config");
const { dbConnect } = require("./db-mongoose");
const localStrategy = require("./passport/local");
const jwtStrategy = require("./passport/jwt");

const userRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const questionRouter = require("./routes/questions");
const recordRouter = require("./routes/records");

const app = express();

app.use(
  morgan(process.env.NODE_ENV === "production" ? "common" : "dev", {
    skip: (req, res) => process.env.NODE_ENV === "test"
  })
);
app.use(express.json());
// app.use(
//   cors({
//      origin: CLIENT_ORIGIN, 
//     allowedHeaders:['Content-Type','Authorization']
//   })
// );
app.use((req, res, next) => { 
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Credentials','true'); 
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization'); 
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE'); 
  if(req.method === 'OPTIONS') { 
    return res.sendStatus(204); 
  } 
  return next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use("/api/user", userRouter);
app.use("/api", authRouter);
app.use("/api/question", questionRouter);
// app.use("/api/records", recordRouter);

// Custom 404 Not Found route handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Custom Error Handler
app.use((err, req, res, next) => {
  console.log(err);
  if (err.status) {
    const errBody = Object.assign({}, err, { message: err.message });
    res.status(err.status).json(errBody);
  } else {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

function runServer(port = PORT) {
  const server = app
    .listen(port, () => {
      console.info(`App listening on port ${server.address().port}`);
    })
    .on("error", err => {
      console.error("Express failed to start");
      console.error(err);
    });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = { app };
