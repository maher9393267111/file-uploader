const express = require("express");
const { fileRouter } = require("./routes/file");
const { fileRouter : fileRouterMulter } = require("./routes/fileMulter");

const { ratingRouter } = require("./routes/ratings");
const path =require("path")

const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.get("/", (req, res) => {
  res.send(
    `<h1>Congratulations! 🎉</h1><p>You've entered file storage application. Enjoy your experience!</p>`
  );
});



app.use("/file", fileRouter);
app.use("/file2", fileRouterMulter);

app.use("/google", ratingRouter);

const port = process.env.PORT || '8000';

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;





// module.exports = {
//   app
// };
