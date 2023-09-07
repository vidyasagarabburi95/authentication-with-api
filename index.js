const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API

// registered user api
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT * FROM user 
  WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    //create user in user table
    const createUserQuery = `
    INSERT INTO user
    (username,name,password,gender,location)
    VALUES
    (   '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    )`;
    await db.run(createUserQuery);
    response.send("user created successfully");
  } else {
    //invalid username or username existed;
    response.status(400);
    response.send("user already existed");
  }
});
// login api
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUsrQuery = `
    SELECT * FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(selectUsrQuery);
  if (dbUser === undefined) {
    //user doesn't exist
    response.status(400);
    response.send("Invalid User");
  } else {
    //compare password and hashedPassword
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("login success");
    } else {
      response.status(400);
      response.send("invalid password");
    }
  }
});
