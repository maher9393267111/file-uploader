const express = require("express");
const fileUpload = require("express-fileupload");
const AWS = require("aws-sdk");
const { db } = require("../configs/db");
const multer = require("multer");
const path =require('path')

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
  "*"
  // "image/jpeg",
  // "image/jpg",
  // "image/png",
  // "text/csv",
  // "text/plain",
  // "application/pdf",
  // "application/mspowerpoint",
  // "application/msword",
  // "application/excel",
  // "audio/mpeg",
  // "audio/mp4",
  // "audio/mp3",
  // "audio/ogg",
  // "audio/vnd.wav",
  // "audio/wave",
  // "video/mp4",
  // "video/3gpp",
  // "video/quicktime",
  // "video/x-ms-wmv",
  // "video/x-msvideo",
  // "video/x-flv",
];


const storage = multer.memoryStorage();

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

// prepare S3 client
const bucketName = "dash93";
const region = "us-east-1";
const accessKeyId = "DO00PHUUAT4VXQF27H6N"
// "DO00M9XA6DJ9P9Y4UWFT";
const secretAccessKey = "P1YyD/tvykl7hpLKBF/g3Ff1KN2yJOunrRlWSXGRa5s"
// "fcWJxA4nn0r5yNKUi1011UzQ66FPMO6Lt8UEuGWSypE";

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
        height: hieghtsize ? hieghtsize : 700,
        width: size ? size : 1000,
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




// ------------------------SLIDER------------

fileRouter.post('/uploads', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    console.log("FILES" , req.files)
    const uploadedFiles = [];





    // Process and upload the new files
    for (const file of req.files) {
      const fileName = `${crypto.randomBytes(32).toString('hex')}${path.extname(file.originalname)}`;
      const size = parseInt(req.query.size);
      const hieghtsize = parseInt(req.query.hieghtsize);

      const fileBuffer = await sharp(file.buffer)
        .resize({
          height: hieghtsize ? hieghtsize : 800,
          width: size ? size : 1000,
          fit: 'fill',
        })
        .toBuffer();

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: fileBuffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        })
      );

      uploadedFiles.push(fileName);
    }

    console.log('Files uploaded and deleted successfully.' ,uploadedFiles);
    res.status(200).json({ files: uploadedFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});





//DELETE ARRAY OF IMAGES


fileRouter.post("/delets", async (req, res) => {
  const { filesToDelete } = req.body;

  console.log("FILES TO DELETE" , filesToDelete ,"BODYYYY-->" , req.body)


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





module.exports = { fileRouter };
