<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h2>Add New Category</h2>
    <form action="http://localhost:3000/category" method="post" enctype="multipart/form-data">
        <label for="title">Title:</label><br>
        <input type="text" id="title" name="title"><br><br>
        <label for="description">Description:</label><br>
        <textarea id="description" name="description" rows="4" cols="50"></textarea><br><br>
        <label for="date">Date:</label><br>
        <input type="date" id="date" name="date"><br><br>

        <label for="file">Image:</label><br>
        <input type="file" id="file" name="file"><br><br>

        <input type="submit" value="Submit">
    </form> 
</body>
</html>
