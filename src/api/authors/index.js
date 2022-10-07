import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import uniqid from "uniqid";
import { getAuthors, getBlogPosts, writeAuthors } from "../../lib/fs-tools.js";

const authorsRouter = express.Router();

authorsRouter.post("/", async (request, response) => {
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

  const authorsArray = await getAuthors();

  authorsArray.push(newAuthor);

  await writeAuthors(authorsArray);

  response.status(201).send({ id: newAuthor.id });
});

// check email post

authorsRouter.post("/checkEmail", async (request, response) => {
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

  const authorsArray = await getAuthors();

  if (
    authorsArray.findIndex((author) => author.email === request.body.email) ===
    -1
  ) {
    authorsArray.push(newAuthor);

    await writeAuthors(authorsArray);

    console.log("Unique Email, new author is posted");

    response.status(201).send({ id: newAuthor.id });
  } else {
    response.status(400).send({ message: "Email already in use" });
  }
});

authorsRouter.get("/", async (request, response) => {
  const authorsArray = await getAuthors();
  console.log("Get all authors:", authorsArray);
  response.send(authorsArray);
});

authorsRouter.get("/:authorId", async (request, response) => {
  console.log(request.params.authorId);

  const authorsArray = await getAuthors();

  const requestedAuthor = authorsArray.find(
    (author) => author.id === request.params.authorId
  );

  console.log(
    "Get Specific Author (with Id " + request.params.authorId + " ) :",
    requestedAuthor
  );

  response.send(requestedAuthor);
});

authorsRouter.get("/:authorId/blogPosts", async (request, response) => {
  const blogPosts = await getBlogPosts();

  const authorsArray = await getAuthors();

  const requestedAuthor = authorsArray.find(
    (author) => author.id === request.params.authorId
  );

  const authorsPosts = blogPosts.filter(
    (blogPost) => blogPost.author.name === requestedAuthor.name
  );

  response.send(authorsPosts);
});

authorsRouter.put("/:authorId", async (request, response) => {
  const avatarUrl =
    "https://ui-avatars.com/api/?name=" +
    request.body.name +
    "+" +
    request.body.surname;

  const authorsArray = await getAuthors();

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

  await writeAuthors(authorsArray);

  response.send(editedAuthor);
});

authorsRouter.delete("/:authorId", async (request, response) => {
  const authorsArray = await getAuthors();

  const newAuthorsArray = authorsArray.filter(
    (author) => author.id !== request.params.authorId
  );

  console.log("Author with id " + request.params.authorId + " deleted.");

  await writeAuthors(newAuthorsArray);

  response.status(204).send();
});

export default authorsRouter;
