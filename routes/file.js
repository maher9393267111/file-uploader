const express = require("express");
const fileUpload = require("express-fileupload");
const AWS = require("aws-sdk");
const { db } = require("../configs/db");



const crypto = require('crypto');
// const multer = require('multer');
const sharp = require('sharp');
const {
    S3Client,
    ListBucketsCommand,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');



const fileRouter = express.Router();

// prepare S3 client
const bucketName = 'dash93';
const region = 'us-east-1';
const accessKeyId = 'DO00M9XA6DJ9P9Y4UWFT';
const secretAccessKey = 'fcWJxA4nn0r5yNKUi1011UzQ66FPMO6Lt8UEuGWSypE';



const endpoint = 'https://nyc3.digitaloceanspaces.com';
const cdnEndpoint = 'https://dash93.nyc3.cdn.digitaloceanspaces.com';

const s3Client = new S3Client({
    endpoint: endpoint,
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});



// Create an S33 instance
// const s3 = new AWS.S3();

// Use the express-fileupload middleware
fileRouter.use(fileUpload());

// Route for file upload to S3
fileRouter.post("/upload", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }
    console.log("s3UploadResponse.Location");
    const uploadedFile = req.files.uploadedFile;
     console.log(uploadedFile,"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

    // Upload the file to S3
    const params = {
      Bucket: "dash93",
      Key: `go/${uploadedFile.name}`,
      Body: uploadedFile.data,
    };


    // const s3UploadResponse = await s3.upload(params).promise();
    var result = await s3Client.send(new PutObjectCommand(params));
    // Ensure that s3UploadResponse.Location is defined
    if (!result) {
      return res
        .status(500)
        .json({ message: "Internal Server Error. S3 Location is undefined." });
    }

    

    console.log("File uploaded successfully.");
    res.status(200).json({ message: "File uploaded successfully." ,result });

  } 
  
  
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Catch Error: Internal Server Error." });
  }
});

// Route to retrieve information about files from RDS
fileRouter.get("/files", async (req, res) => {
  try {
    // Query file information from RDS
    const sql = "SELECT * FROM files";
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error." });
        return;
      }

      // Extract relevant information for the response
      const fileData = result.map((file) => ({
        filename: file.filename,
        fileUrl: file.file_url,
        // lastModified: file.last_modified,
        // size: file.size / 1024 + "KB", // Adjust this based on your RDS schema
      }));

      res.status(200).json(fileData);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// Route to delete a file
fileRouter.delete("/delete/:filename", async (req, res) => {
  const { filename } = req.params;

  try {
    // Find the file in the database
    const sqlSelect = "SELECT * FROM files WHERE filename = ?";
    const rows = db.query(sqlSelect, [filename]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "File not found." });
    }

    // Delete the file from the database
    const sqlDelete = "DELETE FROM files WHERE filename = ?";
    await db.query(sqlDelete, [filename]);

    // You may also want to delete the file from S3 here if needed

    res.status(200).json({ message: "File deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

module.exports = { fileRouter };
