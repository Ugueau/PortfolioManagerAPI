const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const { off } = require("process");

const sqlite = require("sqlite3");
const db = new sqlite.Database(
  "./portfolio.db",
  sqlite.OPEN_READWRITE,
  (err) => {
    if (err) {
      return console.error(err);
    }
  }
);

function makeApp() {
  const app = express();
  // Set the root directory for serving static files
  app.use(express.static(path.join(__dirname, 'storage')));
  const baseLimit = 50;

  app.use(bodyParser.json());

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
            console.error("No match");
            return res.status(400).json({ error: "No match" });
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
    let sql = `SELECT d.*, GROUP_CONCAT(c.title) AS category_titles
    FROM document d
    JOIN document_category dc ON d.id = dc.doc_id
    JOIN category c ON dc.cat_id = c.id

    GROUP BY d.id
    LIMIT ? OFFSET ?;`;
    try {
      db.all(sql, [limit,offset], (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ error: err });
        }
        if (rows.length < 1) {
          console.error("No match");
          return res.status(400).json({ error: "No match" });
        }
        console.log("Successfull request");
        return res.status(200).json({ data: rows });
      });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err });
    }
  });

  app.get("/category", (req, res) => {
    let limit = baseLimit;
    if (req.query.limit !== undefined) {
      limit = req.query.limit;
    }
    let offset = 0;
    if (req.query.offset !== undefined) {
      offset = req.query.offset;
    }
    let category = "all";
    if (req.params.category !== undefined) {
      category = req.params.category;
    }
    let sql = `SELECT d.*
        FROM document d
        JOIN document_category dc ON d.id = dc.doc_id
        JOIN category c ON dc.cat_id = c.id
        WHERE c.title = ?
        LIMIT ? OFFSET ?;`;
    try {
      console.log(sql, [category, limit, offset]);
      db.all(sql, [category, limit, offset], (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ error: err });
        }
        if (rows.length < 1) {
          console.error("No match");
          return res.status(400).json({ error: "No match" });
        }
        console.log("Successfull request");
        return res.status(200).json({ data: rows });
      });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err });
    }
  });

  let currentFileName = "";
  // Multer configuration for handling file uploads
  const storage = multer.diskStorage({
    destination: "./storage/images",
    filename: (req, file, cb) => {
      const name = file.originalname.split(".")[0];
      currentFileName = `${name}_${Date.now()}${path.extname(file.originalname)}`
      console.log(currentFileName);
      return cb(
        null,
        currentFileName
      );
    },
  });

  const upload = multer({
    storage: storage,
    // fileFilter: function (req, file, cb) {
    //   let regex = /\.(jpg|JPG|jpeg|JPEG|png|PNG|pdf)$/;
    //   if (!file.originalname.match(regex)) {
    //     console.log("Don't match regex");
    //     req.fileValidationError = "Only image files are allowed!";
    //     return cb(new Error("Only image files are allowed!"), false);
    //   }
    // },
  });

  app.post("/category", upload.none(), (req, res) => {
    try {
      let title = req.body.title;
      if (title == null || undefined) {
        return res.status(400).json({ error: "Invalid value" });
      }
      console.log(title);
      let sql = "INSERT INTO category (title) VALUES (?);";
      db.run(sql, [title], (err) => {
        if (err) return res.status(300).json({ error: err });
        console.log("Successful input category : ", title);
      });
      return res.status(200).json({ title });
    } catch (err) {
      return res.status(400).json({ error: err });
    }
  });

  app.post("/document", upload.single("file"), async (req, res) => {
    try {
      let { title, desc, date, categories } = req.body;
      const filePath = currentFileName;

      if(categories == null || undefined){
        categories = [];
      }
      
      // Insert into document table
      const documentInsertQuery = "INSERT INTO document (img_path,title,descr,creation_date) VALUES (?,?,?,?);";
      const documentParams = [filePath, title, desc, date];
  
      // Insert into document_category table
      const documentId = await new Promise((resolve, reject) => {
        db.run(documentInsertQuery, documentParams, function(err) {
          if (err) return reject(err);
          resolve(this.lastID); // Return the last inserted row id
        });
      });
  
      const categoryInsertQuery = "INSERT INTO document_category (doc_id, cat_id) VALUES (?, ?);";
      const updatedCategories = [...categories, "1"];
      for (const categoryId of updatedCategories) {
        await new Promise((resolve, reject) => {
          db.run(categoryInsertQuery, [documentId, categoryId], function(err) {
            if (err) return reject(err);
            resolve();
          });
        });
      }
  
      console.log("Successful input document: ", title);
      return res.status(201).json({ filePath,title, desc, date, updatedCategories });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/image/:imgPath', (req, res) => {
    let img = req.params.imgPath;
    if (img == null || undefined) {
      return res.status(400).json({ error: "Invalid value" });
    }
    const imagePath = path.join(__dirname, 'storage', 'images', img);

    // Send the image file
    res.sendFile(imagePath);
  });
  

  app.PORT = process.env.PORT || 3000;
  return app;
}

module.exports = {
  makeApp,
};
