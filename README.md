# Portfolio Manager API

This API is designed to handle documents for a portfolio website. It provides endpoints to manage documents such as projects, blog posts, or other content related to the portfolio.

## Usage

To run the API using Docker, follow these steps:

1. Build the Docker image:

    ```bash
    docker build -t portfolio_manager_api .
    ```

2. Run the Docker container:

    ```bash
    docker run -p 3000:3000 --name portfolio-api-container portfolio_manager_api
    ```

    This command will start the API container and expose it on port 3000.

### API Endpoints

- **GET /document/:id**: Retrieve a document by ID.

    Example:
    ```bash
    curl http://localhost:3000/document/123
    ```

- **GET /documents**: Retrieve all documents.

    Example:
    ```bash
    curl http://localhost:3000/documents
    ```

- **GET /category**: Retrieve documents by category.

    Example:
    ```bash
    curl http://localhost:3000/category?category=portfolio
    ```

- **POST /category**: Create a new category.

    Example:
    ```bash
    curl -X POST -d "title=new_category" http://localhost:3000/category
    ```

- **POST /document**: Create a new document.

    Example:
    ```bash
    curl -X POST -F "title=New Document" -F "desc=Description" -F "date=2024-04-27" -F "categories[]=1" -F "file=@/path/to/image.jpg" http://localhost:3000/document
    ```

- **GET /image/:imgPath**: Retrieve an image by file path.

    Example:
    ```bash
    curl http://localhost:3000/image/image.jpg
    ```

## Environment Variables

- `PORT`: The port on which the API server runs. Default is 3000.

## Dependencies

- Node.js
- Express.js
- Multer
- SQLite
