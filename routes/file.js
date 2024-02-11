const express = require("express");
const fileUpload = require("express-fileupload");
const AWS = require("aws-sdk");
const { db } = require("../configs/db");
const multer = require("multer");

const crypto = require("crypto");
// const multer = require('multer');
const sharp = require("sharp");
const {
  S3Client,
  ListBucketsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const validFileTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "text/csv",
  "text/plain",
  "application/pdf",
  "application/mspowerpoint",
  "application/msword",
  "application/excel",
  "audio/mpeg",
  "audio/mp4",
  "audio/mp3",
  "audio/ogg",
  "audio/vnd.wav",
  "audio/wave",
  "video/mp4",
  "video/3gpp",
  "video/quicktime",
  "video/x-ms-wmv",
  "video/x-msvideo",
  "video/x-flv",
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (validFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  },
});

const fileRouter = express.Router();

// prepare S3 client
const bucketName = "dash93";
const region = "us-east-1";
const accessKeyId = "DO00M9XA6DJ9P9Y4UWFT";
const secretAccessKey = "fcWJxA4nn0r5yNKUi1011UzQ66FPMO6Lt8UEuGWSypE";

const endpoint = "https://nyc3.digitaloceanspaces.com";
const cdnEndpoint = "https://dash93.nyc3.cdn.digitaloceanspaces.com";

const s3Client = new S3Client({
  endpoint: endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

fileRouter.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const fileName = crypto.randomBytes(32).toString("hex");

    const size = parseInt(req.query.size);
    const hieghtsize = parseInt(req.query.hieghtsize);

    console.log("HEEEEE🐦  ❤️🐦  ❤️🐦  ❤️🐦  ❤️EEE", req.file);

    const fileBuffer = await sharp(req.file.buffer)
      .resize({
        height: hieghtsize ? hieghtsize : 500,
        width: size ? size : 500,
        fit: "cover",
      })
      .toBuffer();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: "dash93",
        Key: fileName,
        Body: fileBuffer,
        ContentType: req.file.mimetype,

        ACL: "public-read",
      })
    );

    //  collection = req.query.collection
    const oldfile = req.query.oldfile;

    // const session = await getServerAuthSession({ req, res });
    //const oldURL = session.user.image;
    //onst oldKey = oldURL.substring(oldURL.lastIndexOf("/") + 1);

    //const newURL = `${env.NEXT_PUBLIC_BUCKET_URL}/${key}`;

    if (oldfile) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: "dash93",
          Key: oldfile,
        })
      );
    }

    // if (!result) {
    //   return res
    //     .status(500)
    //     .json({ message: "Internal Server Error. S3 Location is undefined." });
    // }

    console.log("File uploaded successfully.");
    res.status(200).json({ fileName: fileName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Catch Error: Internal Server Error.",erroMessage:error?.message });
  }
});


// Route to delete a file
fileRouter.post("/delete", async (req, res) => {
  const { link } = req.body;

  try {
    // Find the file in the database

    if (!link) {
      return res.status(400).json({ message: "No image to delete" });
    }

    if (link) {
      const deleteParams = {
        Bucket: "dash93",
        Key: link,
      };
      await s3Client.send(new DeleteObjectCommand(deleteParams));

      res.json({ message: "Image Deleted Successfully" });
    }






    // res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

module.exports = { fileRouter };
