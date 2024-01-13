const mysql = require("mysql");

const db = mysql.createConnection({
  host: "database-1.cvepsnpfaill.ap-south-1.rds.amazonaws.com",
  port: "3306",
  user: "admin",
  password: "anil.867",
  database: "myDB",
});

db.connect((err) => {
  if (err) {
    console.log(err.message);
    return;
  }
  console.log("Connected to db");
});

module.exports = { db };
