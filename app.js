const express = require("express");
const multer = require("multer");
const fs = require('fs');
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const { off } = require("process");

const sqlite = require("sqlite3");
const { log } = require("console");
const db = new sqlite.Database(
  "./portfolio.db",
  sqlite.OPEN_READWRITE,
  (err) => {
    if (err) {
      return console.error(err);
    }
  }
);
db.run('PRAGMA foreign_keys = ON;');

function makeApp() {
  const app = express();
  // Set the root directory for serving static files
  app.use(express.static(path.join(__dirname, "storage")));
  const baseLimit = 50;

  app.use(bodyParser.json());
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:6969"); // update to match the domain you will make the request from
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  app.get("/status", (request, response) => {
    const status = {
      Status: "Running...",
    };
    response.send(status);
  });

  app.get("/document/:id", (req, res) => {
    let docId = req.params.id;
    if (docId != null) {
      let sql = `SELECT d.*, GROUP_CONCAT(c.title) AS category_titles
      FROM document d
      JOIN document_category dc ON d.id = dc.doc_id
      JOIN category c ON dc.cat_id = c.id
      WHERE d.id = ?
      GROUP BY d.id
      LIMIT 1;`;
      try {
        db.all(sql, [docId], (err, rows) => {
          if (err) {
            console.error(err);
            return res.status(400).json({ error: err });
          }
          if (rows.length < 1) {
            console.error("No match id : ", id);
            return res.status(400).json({ error: "No match", id });
          }
          console.log("Successfull request for document : ", docId);
          return res.status(200).json({ data: rows });
        });
      } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err });
      }
    } else {
      return res.status(400).json({ error: "Bad document id" });
    }
  });

  app.get("/documents", (req, res) => {
    let limit = baseLimit;
    if (req.query.limit !== undefined) {
      limit = req.query.limit;
    }
    let offset = 0;
    if (req.query.offset !== undefined) {
      offset = req.query.offset;
    }
    let sql = `SELECT d.*, GROUP_CONCAT(DISTINCT c.title) AS categories, GROUP_CONCAT(DISTINCT i.img_path) AS images
    FROM document d
    LEFT JOIN document_category dc ON d.id = dc.doc_id
    LEFT JOIN category c ON dc.cat_id = c.id
    LEFT JOIN image i ON d.id = i.doc_id

    GROUP BY d.id
    LIMIT ? OFFSET ?;`;
    try {
      db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ error: err });
        }
        if (rows.length < 1) {
          console.error("No match");
          return res.status(400).json({ error: "No match" });
        }
        rows.forEach(row => {
          if (row.images) {
            row.images = row.images.split(',').map(img => "http://localhost:3000/image/" + img);;
          } else {
            row.images = [];
          }
          if (row.categories) {
            row.categories = row.categories.split(',');
          } else {
            row.categories = [];
          }
        });
        console.log("Successfull request");
        return res.status(200).json({ data: rows });
      });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err });
    }
  });

  app.get("/category/:catName", (req, res) => {
    let limit = baseLimit;
    if (req.query.limit !== undefined) {
      limit = req.query.limit;
    }
    let offset = 0;
    if (req.query.offset !== undefined) {
      offset = req.query.offset;
    }
    let sql = `SELECT d.*, GROUP_CONCAT(DISTINCT c.title) AS categories, GROUP_CONCAT(DISTINCT i.img_path) AS images
        FROM document d
        LEFT JOIN image i ON d.id = i.doc_id
        LEFT JOIN document_category dc ON d.id = dc.doc_id
        LEFT JOIN category c ON dc.cat_id = c.id
        WHERE c.title = ?
        GROUP BY d.id
        LIMIT ? OFFSET ?;`;

    let category = "";
    let args =  [];
    if (req.params.catName !== undefined && req.params.catName !== "all") {
      category = req.params.catName;
      args = [category, limit, offset];
    }else{
      sql = `SELECT d.*, GROUP_CONCAT(DISTINCT c.title) AS categories, GROUP_CONCAT(DISTINCT i.img_path) AS images
      FROM document d
      LEFT JOIN image i ON d.id = i.doc_id
      LEFT JOIN document_category dc ON d.id = dc.doc_id
      LEFT JOIN category c ON dc.cat_id = c.id
      GROUP BY d.id
      LIMIT ? OFFSET ?;`
      args = [limit, offset];
    }
    try {
      db.all(sql, [category, limit, offset], (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ error: err });
        }
        if (rows.length < 1) {
          console.error("No match");
          return res.status(400).json({ error: "No match" });
        }
        rows.forEach(row => {
          if (row.images) {
            row.images = row.images.split(',');
          } else {
            row.images = [];
          }
          if (row.categories) {
            row.categories = row.categories.split(',');
          } else {
            row.categories = [];
          }
        });
        console.log("Successfull request");
        return res.status(200).json({ data: rows });
      });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err });
    }
  });

  const imageFilter = function (req, file, cb) {
    // Check if the file is an image
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      console.log("Unauthorized file : ", file.originalname);
      cb(null, false);
    } else {
      cb(null, true);
    }
  };

  // Multer configuration for handling file uploads
  const storage = multer.diskStorage({
    destination: "./storage/images",
    filename: (req, file, cb) => {
      const name = file.originalname.split(".")[0];
      let currentFileName = `${name}_${Date.now()}${path.extname(
        file.originalname
      )}`;
      console.log(currentFileName);
      return cb(null, currentFileName);
    },
  });

  const upload = multer({
    storage: storage,
    fileFilter: imageFilter,
  });

  app.post("/document", upload.array("files", 10), async (req, res) => {
    try {
      let { title, desc, link, date, categories } = req.body;

      if (categories == null || undefined) {
        categories = [];
      }
      else{
        categories = categories.split(",")
      }
      if (date == null || undefined) {
        date = new Date()
        date = date.toISOString().slice(0, 19).replace('T', ' ');
        console.log(date);
      }

      // Insert into document table
      const documentInsertQuery =
        "INSERT INTO document (title,descr,creation_date,link) VALUES (?,?,?,?);";
      const documentParams = [title, desc, date, link];

      // Insert into document_category table
      const documentId = await new Promise((resolve, reject) => {
        db.run(documentInsertQuery, documentParams, function (err) {
          if (err) return reject(err);
          resolve(this.lastID); // Return the last inserted row id
        });
      });

      const categoryInsertQuery =
        "INSERT INTO document_category (doc_id, cat_id) VALUES (?, ?);";
      const updatedCategories = [...categories];
      for (const categoryId of updatedCategories) {
        await new Promise((resolve, reject) => {
          db.run(categoryInsertQuery, [documentId, categoryId], function (err) {
            if (err) return reject(err);
            resolve();
          });
        });
      }

      const imageInsertQuery = "INSERT INTO image (doc_id, img_path) VALUES (?, ?);";
      req.files.forEach(async file => {
        await new Promise((resolve, reject) => {
          db.run(imageInsertQuery, [documentId, file.filename], function (err) {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      console.log("Successful input document: ", title);
      return res
        .status(201)
        .json({ id:documentId, title, desc, date, link, updatedCategories });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post("/category", async (req, res) => {
    try {
      let title = req.body.title;
      if (title === null || title === undefined) {
        return res.status(403).json({ error: "Invalid value" });
      }
      console.log(title);
      let sql = "INSERT INTO category (title) VALUES (?);";
      await new Promise((resolve, reject) => {
        db.run(sql, [title], (err) => {
          if (err) reject(err);
          console.log("Successful input category : ", title);
          resolve();
        });
      });
      return res.status(200).json({ title });
    } catch (err) {
      return res.status(400).json({ error: err });
    }
  });

  app.get("/image/:imgPath", (req, res) => {
    let img = req.params.imgPath;
    if (img == null || undefined) {
      return res.status(400).json({ error: "Invalid value" });
    }
    const imagePath = path.join(__dirname, "storage", "images", img);

    // Send the image file
    res.sendFile(imagePath);
  });

  app.delete("/document/:id", async (req, res) => {
    try {
      let sql = "SELECT img_path FROM image where doc_id = ?";
      const argms = req.params.id;
      await new Promise((resolve, reject) => {
        db.all(sql, argms, (err, rows) => {
          if (err) {
            console.error(err);
            reject(err);
          }
          rows.forEach(imgPath => {
            fs.unlink(`./storage/images/${imgPath.img_path}`, (err) => {
              if (err) {
                console.error('Error deleting file:', err);
              }
              console.log('File deleted successfully : ',imgPath.img_path);
            });
          });
        });
        sql = "DELETE FROM document where id = ?";
        db.run(sql, argms, (err) => {
          if (err) {
            console.error(err);
            reject(err);
          }
        });
        resolve();
      });
      console.log("Delete Success");
      return res.status(200).json({ deletedId: argms });
    } catch (err) {
      return res.status(400).json({ error: err });
    }
  });

  app.PORT = process.env.PORT || 3000;
  return app;
}

module.exports = {
  makeApp,
};
