-- Create document table
CREATE TABLE document (
    img_path varchar(255) UNIQUE NOT NULL,
    title TEXT,
    descr TEXT,
    creation_date DATETIME,
    id INTEGER PRIMARY KEY auto_increment
);

-- Create category table
CREATE TABLE category (
    title TEXT,
    id INTEGER PRIMARY KEY auto_increment
);

-- Create document_category table
CREATE TABLE document_category (
    doc_id INTEGER,
    cat_id INTEGER,
    FOREIGN KEY(doc_id) REFERENCES document(id),
    FOREIGN KEY(cat_id) REFERENCES category(id),
    PRIMARY KEY(doc_id, cat_id)
);

-- Insert mandatory category
INSERT INTO category (title) VALUES ('all');
