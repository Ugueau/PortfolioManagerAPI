CREATE TABLE document(
"img_path" TEXT UNIQUE NOT NULL,
"title" TEXT,
"descr" TEXT,
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
FOREIGN KEY(doc_id) REFERENCES document(id),
FOREIGN KEY(cat_id) REFERENCES category(id),
PRIMARY KEY("doc_id","cat_id")
);

-- MANDATORY Category
INSERT INTO category ("title") VALUES
('all');
