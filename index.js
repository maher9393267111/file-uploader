const express = require("express");
const { fileRouter } = require("./routes/file");
const { ratingRouter } = require("./routes/ratings");

const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

app.get("/", (req, res) => {
  res.send(
    `<h1>Congratulations! 🎉</h1><p>You've entered file storage application. Enjoy your experience!</p>`
  );
});

// // Route to retrieve information about files from RDS
// app.get("/files", async (req, res) => {
//   try {
//     // Query file information from RDS
//     const sql = "SELECT * FROM files";
//     db.query(sql, (err, result) => {
//       if (err) {
//         console.error(err);
//         res.status(500).json({ message: "Internal Server Error." });
//         return;
//       }

//       // Extract relevant information for the response
//       const fileData = result.map((file) => ({
//         filename: file.filename,
//         fileUrl: file.file_url,
//         // lastModified: file.last_modified,
//         // size: file.size / 1024 + "KB", // Adjust this based on your RDS schema
//       }));

//       res.status(200).json(fileData);
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error." });
//   }
// });

app.use("/file", fileRouter);
app.use("/google", ratingRouter);

const port = process.env.PORT || '8000';

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;





// module.exports = {
//   app
// };
