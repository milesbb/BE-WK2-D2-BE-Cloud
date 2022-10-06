import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import uniqid from "uniqid";

const authorsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "authors.json"
);

const getAuthors = () => JSON.parse(fs.readFileSync(authorsJSONPath));
const writeAuthors = (authorsArray) =>
  fs.writeFileSync(authorsJSONPath, JSON.stringify(authorsArray));

console.log("Location of data:", authorsJSONPath);

const authorsRouter = express.Router();

authorsRouter.post("/", (request, response) => {
  const avatarUrl =
    "https://ui-avatars.com/api/?name=" +
    request.body.name +
    "+" +
    request.body.surname;

  const newAuthor = {
    ...request.body,
    createdAt: new Date(),
    id: uniqid(),
    avatar: avatarUrl,
  };
  console.log("New Author:", newAuthor);

  const authorsArray = getAuthors();

  authorsArray.push(newAuthor);

  writeAuthors(authorsArray);

  response.status(201).send({ id: newAuthor.id });
});

// check email post

authorsRouter.post("/checkEmail", (request, response) => {
  const avatarUrl =
    "https://ui-avatars.com/api/?name=" +
    request.body.name +
    "+" +
    request.body.surname;
  const newAuthor = {
    ...request.body,
    createdAt: new Date(),
    id: uniqid(),
    avatar: avatarUrl,
  };
  console.log("New Author:", newAuthor);

  const authorsArray = getAuthors();

  if (
    authorsArray.findIndex((author) => author.email === request.body.email) ===
    -1
  ) {
    authorsArray.push(newAuthor);

    writeAuthors(authorsArray);

    console.log("Unique Email, new author is posted");

    response.status(201).send({ id: newAuthor.id });
  } else {
    

    response.status(400).send({"message": "Email already in use"});
  }
});

authorsRouter.get("/", (request, response) => {
  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));
  console.log("Get all authors:", authorsArray);
  response.send(authorsArray);
});

authorsRouter.get("/:authorId", (request, response) => {
  console.log(request.params.authorId);

  const authorsArray = getAuthors();

  const requestedAuthor = authorsArray.find(
    (author) => author.id === request.params.authorId
  );

  console.log(
    "Get Specific Author (with Id " + request.params.authorId + " ) :",
    requestedAuthor
  );

  response.send(requestedAuthor);
});

authorsRouter.put("/:authorId", (request, response) => {
  const avatarUrl =
    "https://ui-avatars.com/api/?name=" +
    request.body.name +
    "+" +
    request.body.surname;

  const authorsArray = getAuthors();

  const authorIndex = authorsArray.findIndex(
    (author) => author.id === request.params.authorId
  );

  const oldAuthor = authorsArray[authorIndex];

  const editedAuthor = {
    ...oldAuthor,
    ...request.body,
    updatedAt: new Date(),
    avatar: avatarUrl,
  };

  authorsArray[authorIndex] = editedAuthor;

  console.log("Edit Author, updated entry:", editedAuthor);

  writeAuthors(authorsArray);

  response.send(editedAuthor);
});

authorsRouter.delete("/:authorId", (request, response) => {
  const authorsArray = getAuthors();

  const newAuthorsArray = authorsArray.filter(
    (author) => author.id !== request.params.authorId
  );

  console.log("Author with id " + request.params.authorId + " deleted.");

  writeAuthors(newAuthorsArray);

  response.status(204).send();
  
});

export default authorsRouter;
