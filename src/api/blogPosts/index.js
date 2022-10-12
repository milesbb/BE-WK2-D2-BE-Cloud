import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, extname, join } from "path";
import uniqid from "uniqid";
import { v2 as cloudinary } from "cloudinary";
import createHttpError from "http-errors";
import { checkBlogPostSchema, checkValidationResult } from "./validation.js";
import {
  getBlogPosts,
  saveBlogPostsCovers,
  writeBlogPosts,
} from "../../lib/fs-tools.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { createBlogPostPdf } from "../../lib/pdf-tools.js";
import { pipeline } from "stream";

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BEwk2d2/blogPosts",
    },
  }),
  limits: { fileSize: 1024 * 1024 },
}).single("avatar");

const cloudinaryPDFUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BEwk2d2/PDFs",
    },
  }),
  limits: { fileSize: 1024 * 1024 },
}).single("avatar");

const blogPostsRouter = express.Router();

// CREATE BLOG POST PDF

blogPostsRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const idParam = req.params.id;

    res.setHeader("Content-Disposition", `attachment; filename=blogPost${idParam}.pdf`);

    const source = await  createBlogPostPdf(idParam)
    const destination = res;
    
    pipeline(source, destination, (error) => {
      if (error) console.log(error);
    });
  } catch (error) {
    next(error);
  }
});

// POST CLOUDINARY COVER IMAGE

blogPostsRouter.post(
  "/:id/cloudinary",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      console.log("file: " + req.file);

      const fileName = req.params.id + extname(req.file.originalname);

      const cloudinaryURL =
        "https://res.cloudinary.com/dycynydei/image/upload/BEwk2d2/blogPosts/" +
        fileName;

      const blogPostsArray = await getBlogPosts();

      const blogPostIndex = blogPostsArray.findIndex(
        (blogPost) => blogPost._id === req.params.id
      );

      if (blogPostIndex !== -1) {
        const oldBlogPost = blogPostsArray[blogPostIndex];

        const editedBlogPost = {
          ...oldBlogPost,
          updatedAt: new Date(),
          cover: cloudinaryURL,
        };

        blogPostsArray[blogPostIndex] = editedBlogPost;

        console.log("Edit Blog Post, updated entry:", editedBlogPost);

        await writeBlogPosts(blogPostsArray);

        res.send({
          message: "Image has been uploaded successfully",
          editedBlogPost: editedBlogPost,
        });
      } else {
        next(error);
      }
    } catch (error) {
      next(error);
    }
  }
);

// POST COVER IMAGE

blogPostsRouter.post(
  "/:id/uploadCover",
  multer().single("cover"),
  async (req, res, next) => {
    try {
      console.log("file: " + req.file);

      const fileName = req.params.id + extname(req.file.originalname);

      await saveBlogPostsCovers(fileName, req.file.buffer);

      const blogPostsArray = await getBlogPosts();

      const newCoverUrl = join("/public/img/covers/", fileName);

      const blogPostIndex = blogPostsArray.findIndex(
        (blogPost) => blogPost._id === req.params.id
      );

      if (blogPostIndex !== -1) {
        const oldBlogPost = blogPostsArray[blogPostIndex];

        const editedBlogPost = {
          ...oldBlogPost,
          updatedAt: new Date(),
          cover: newCoverUrl,
        };

        blogPostsArray[blogPostIndex] = editedBlogPost;

        console.log("Edit Blog Post, updated entry:", editedBlogPost);

        await writeBlogPosts(blogPostsArray);

        res.send({
          message: "Image has been uploaded successfully",
          editedBlogPost: editedBlogPost,
        });
      } else {
        next(error);
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET COMMENTS

blogPostsRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();

    const blogPostIndex = blogPosts.findIndex(
      (blogPost) => blogPost._id === req.params.id
    );

    if (blogPostIndex !== -1) {
      const comments = blogPosts[blogPostIndex].comments;

      res.status(200).send(comments);
    } else {
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

// POST COMMENTS

blogPostsRouter.post("/:id/comments", async (req, res, next) => {
  try {
    const newComment = {
      ...req.body,
      createdAt: new Date(),
      _id: uniqid(),
    };

    const blogPosts = await getBlogPosts();

    const blogPostIndex = blogPosts.findIndex(
      (blogPost) => blogPost._id === req.params.id
    );

    if (blogPostIndex !== -1) {
      blogPosts[blogPostIndex].comments.push(newComment);

      await writeBlogPosts(blogPosts);
      res.status(201).send({ message: "New comment created" });
    } else {
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

// EDIT POST COMMENT

blogPostsRouter.put("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();

    const blogPostIndex = blogPosts.findIndex(
      (blogPost) => blogPost._id === req.params.id
    );

    if (blogPostIndex === -1) {
      next(
        createHttpError(404, `Blog post with id ${req.params.id} not found`)
      );
    } else {
      const selectedBlogPost = blogPosts[blogPostIndex];

      const commentIndex = selectedBlogPost.comments.findIndex(
        (comment) => comment._id === req.params.commentId
      );

      if (commentIndex === -1) {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`
          )
        );
      } else {
        const oldComment = selectedBlogPost.comments[commentIndex];

        const editedComment = {
          ...oldComment,
          ...req.body,
          updatedAt: new Date(),
        };

        selectedBlogPost.comments[commentIndex] = editedComment;

        const newBlogPosts = blogPosts;
        newBlogPosts[blogPostIndex].comments = selectedBlogPost.comments;

        await writeBlogPosts(newBlogPosts);

        res.send(editedComment);
      }
    }
  } catch (error) {
    next(error);
  }
});

// DELETE POST COMMENT

blogPostsRouter.delete("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const blogPosts = await getBlogPosts();

    const blogPostIndex = blogPosts.findIndex(
      (blogPost) => blogPost._id === req.params.id
    );

    if (blogPostIndex === -1) {
      next(
        createHttpError(404, `Blog post with id ${req.params.id} not found`)
      );
    } else {
      const selectedBlogPost = blogPosts[blogPostIndex];

      const commentIndex = selectedBlogPost.comments.findIndex(
        (comment) => comment._id === req.params.commentId
      );
      if (commentIndex === -1) {
        next(
          createHttpError(
            404,
            `Comment with id ${req.params.commentId} not found`
          )
        );
      } else {
        const newComments = selectedBlogPost.comments.filter(
          (comment) => comment._id !== req.params.commentId
        );

        const newBlogPosts = blogPosts;

        newBlogPosts[blogPostIndex].comments = newComments;

        await writeBlogPosts(newBlogPosts);

        res
          .status(204)
          .send({ message: `Comment ${req.params.commentId} deleted` });
      }
    }
  } catch (error) {
    next(error);
  }
});

// POST POST

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
