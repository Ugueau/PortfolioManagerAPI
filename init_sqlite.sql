CREATE TABLE document(
"title" TEXT,
"descr" TEXT,
"link" TEXT,
"creation_date" datetime,
"id"	INTEGER,
PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE category(
"title" TEXT,
"id"	INTEGER,
PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE document_category(
"doc_id" INTEGER,
"cat_id" INTEGER,
FOREIGN KEY(doc_id) REFERENCES document(id) ON DELETE CASCADE,
FOREIGN KEY(cat_id) REFERENCES category(id) ON DELETE CASCADE,
PRIMARY KEY("doc_id","cat_id")
);

CREATE TABLE image(
"doc_id" INTEGER,
"img_path" TEXT UNIQUE,
FOREIGN KEY(doc_id) REFERENCES document(id) ON DELETE CASCADE,
PRIMARY KEY("doc_id","img_path")
);

-- MANDATORY Category
INSERT INTO category ("title") VALUES
('all');
