import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import uniqid from "uniqid";

const authorsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "authors.json"
);

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

  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));

  authorsArray.push(newAuthor);

  fs.writeFileSync(authorsJSONPath, JSON.stringify(authorsArray));

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

  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));

  if (
    authorsArray.findIndex((author) => author.email === request.body.email) ===
    -1
  ) {
    authorsArray.push(newAuthor);

    fs.writeFileSync(authorsJSONPath, JSON.stringify(authorsArray));

    console.log("Unique Email, new author is posted");

    response.status(201).send({ id: newAuthor.id });
  } else {
    console.log("Email already in use");

    response.status(400).send();
  }
});

authorsRouter.get("/", (request, response) => {
  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));
  console.log("Get all authors:", authorsArray);
  response.send(authorsArray);
});

authorsRouter.get("/:authorId", (request, response) => {
  console.log(request.params.authorId);

  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));

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

  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));

  const authorIndex = authorsArray.findIndex(
    (author) => author.id === request.params.authorId
  );

  const oldAuthor = authorsArray[authorIndex];

  const editedAuthor = { ...oldAuthor, ...request.body, updatedAt: new Date(), avatar: avatarUrl };

  authorsArray[authorIndex] = editedAuthor;

  console.log("Edit Author, updated entry:", editedAuthor);

  fs.writeFileSync(authorsJSONPath, JSON.stringify(authorsArray));

  response.send(editedAuthor);
});

authorsRouter.delete("/:authorId", (request, response) => {
  const authorsArray = JSON.parse(fs.readFileSync(authorsJSONPath));

  const newAuthorsArray = authorsArray.filter(
    (author) => author.id !== request.params.authorId
  );

  console.log("Author with id " + request.params.authorId + " deleted.");

  fs.writeFileSync(authorsJSONPath, JSON.stringify(newAuthorsArray));

  response.status(204).send();
});

export default authorsRouter;
