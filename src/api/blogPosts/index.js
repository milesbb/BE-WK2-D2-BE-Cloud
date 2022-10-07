import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { checkBlogPostSchema, checkValidationResult } from "./validation.js";
import { getBlogPosts, writeBlogPosts } from "../../lib/fs-tools.js";

const blogPostsRouter = express.Router();

blogPostsRouter.post(
  "/",
  checkBlogPostSchema,
  checkValidationResult,
  async (req, res, next) => {
    try {
      const newBlogPost = {
        ...req.body,
        createdAt: new Date(),
        _id: uniqid(),
      };

      const blogPosts = await getBlogPosts();

      blogPosts.push(newBlogPost);

      await writeBlogPosts(blogPosts);

      res.status(201).send({ _id: newBlogPost._id });
    } catch (error) {
      next(error);
    }
  }
);

blogPostsRouter.get("/", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();
    res.status(200).send(blogPosts);
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.get("/:blogPostId", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();

    const requestedBlogPost = blogPosts.find(
      (blogPost) => blogPost._id === req.params.blogPostId
    );

    if (requestedBlogPost) {
      res.status(200).send(requestedBlogPost);
    } else {
      next(
        createHttpError(
          404,
          `Blog post with id ${req.params.blogPostId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.put("/:blogPostId", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();

    const blogPostIndex = blogPosts.findIndex(
      (blogPost) => blogPost._id === req.params.blogPostId
    );

    if (blogPostIndex === -1) {
      next(
        createHttpError(
          404,
          `Blog post with id ${req.params.blogPostId} not found`
        )
      );
    } else {
      const oldBlogPost = blogPosts[blogPostIndex];

      const editedBlogPost = {
        ...oldBlogPost,
        ...req.body,
        updatedAt: new Date(),
      };

      blogPosts[blogPostIndex] = editedBlogPost;

      await writeBlogPosts(blogPosts);

      res.send(editedBlogPost);
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.delete("/:blogPostId", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();
    if (
      blogPosts.findIndex(
        (blogPost) => blogPost._id === req.params.blogPostId
      ) === -1
    ) {
      next(
        createHttpError(
          404,
          `Blog post with id ${req.params.blogPostId} not found`
        )
      );
    } else {
      const newBlogPostsArray = blogPosts.filter(
        (blogPost) => blogPost._id !== req.params.blogPostId
      );

      await writeBlogPosts(newBlogPostsArray);

      res
        .status(204)
        .send({ message: `Post ${req.params.blogPostId} deleted` });
    }
  } catch (error) {
    next(error);
  }
});

export default blogPostsRouter;
