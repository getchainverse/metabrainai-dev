const express = require("express");

const cors = require("cors");

const cookieSession = require("cookie-session");

require("dotenv").config();

const app = express();

app.use(cors());
/* for Angular Client (withCredentials) */
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000"],
  })
);

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

// Trust the first proxy hop so client IPs are correct for rate limiting
// and so secure cookies work behind a TLS-terminating proxy.
if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cookieSession({
    name: "bezkoder-session",
    keys: [process.env.COOKIE_SECRET || "dev-only-insecure-cookie-change-me"],
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction, // require HTTPS for the session cookie in production
  })
);

// database
// const db = require("./app/models");
// const Role = db.role;

// db.sequelize.sync({ alter: true }).then(() => {
//   initial();
// });
// force: true will drop the table if it already exists
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and Resync Database with { force: true }');
//   initial();
// });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/doc.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.create({
    id: 1,
    name: "sales",
  });

  Role.create({
    id: 2,
    name: "vp",
  });

  Role.create({
    id: 3,
    name: "admin",
  });

  Role.create({
    id: 4,
    name: "level",
  });
}
