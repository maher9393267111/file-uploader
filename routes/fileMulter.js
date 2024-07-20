const express = require("express");
const fileUpload = require("express-fileupload");
const AWS = require("aws-sdk");
const { db } = require("../configs/db");
const multer = require("multer");
const path = require("path");
const fs = require ("fs")

const crypto = require("crypto");
// const multer = require('multer');
const sharp = require("sharp");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  // fileFilter: (req, file, cb) => {
  //   if (validFileTypes.includes(file.mimetype)) {
  //     cb(null, true);
  //   } else {
  //     cb(new Error("Invalid file type."));
  //   }
  // },
});

const fileRouter = express.Router();

// ----------------------SINGLE FILE IMAGE ---------------

fileRouter.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded" });
    }

    const file = req.file;
    console.log("FILE-->", file);
    const fileName = `${crypto.randomBytes(32).toString("hex")}${path.extname(
      file.originalname
    )}`;
    const size = parseInt(req.query.size);
    const hieghtsize = parseInt(req.query.hieghtsize);

    const fileBuffer = await sharp(file.path)
      .resize({
        height: hieghtsize ? hieghtsize : 450,
        width: size ? size : 900,
        fit: "fill",
      })
      .toBuffer();

    const filename = `${Date.now()}-${file.originalname}`;
    const imagePath = path.join(__dirname, "..", "public", file?.filename);

    fs.writeFileSync(imagePath, fileBuffer);
    fs.unlinkSync(imagePath);

    console.log("File uploaded successfully:", filename);
    res.status(200).json({ file: filename });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

fileRouter.delete("/delete", async (req, res) => {
  try {
    const { fileName } = req.query;

    console.log("DELETE BODY-->", req.query);

    if (!fileName) {
      return res.status(400).json({ message: "No file name provided" });
    }

    fs.unlinkSync(`public/${fileName}`);

    console.log("File deleted successfully:", fileName);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ------------------------SLIDER------------

fileRouter.post("/uploads", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded" });
    }

    console.log("FILES", req.files);
    const uploadedFiles = [];

    // Process and upload the new files
    for (const file of req.files) {
      const fileName = `${crypto.randomBytes(32).toString("hex")}${path.extname(
        file.originalname
      )}`;
      const size = parseInt(req.query.size);
      const hieghtsize = parseInt(req.query.hieghtsize);

      const fileBuffer = await sharp(file.buffer)
        .resize({
          height: hieghtsize ? hieghtsize : 800,
          width: size ? size : 1000,
          fit: "fill",
        })
        .toBuffer();

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: fileBuffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        })
      );

      uploadedFiles.push(fileName);
    }

    console.log("Files uploaded and deleted successfully.", uploadedFiles);
    res.status(200).json({ files: uploadedFiles });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

//DELETE ARRAY OF IMAGES

fileRouter.post("/delets", async (req, res) => {
  const { filesToDelete } = req.body;

  console.log("FILES TO DELETE", filesToDelete, "BODYYYY-->", req.body);

  try {
    if (!filesToDelete || filesToDelete.length === 0) {
      return res.status(400).json({ message: "No files to delete" });
    }

    for (const file of filesToDelete) {
      const deleteParams = {
        Bucket: "dash93",
        Key: file,
      };
      await s3Client.send(new DeleteObjectCommand(deleteParams));
    }

    res.json({ message: "Files deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// -----------------

module.exports = { fileRouter };
