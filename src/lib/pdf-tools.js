import PdfPrinter from "pdfmake";
import { getAuthors, getBlogPosts } from "./fs-tools.js";

export async function createBlogPostPdf(id) {
  const fonts = {
    Roboto: {
      normal:
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
      bold: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf",
      italics:
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf",
      bolditalics:
        "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf",
    },
  };

  const printer = new PdfPrinter(fonts);

  const blogPosts = await getBlogPosts();

  const authors = await getAuthors();

  const blogPostIndex = blogPosts.findIndex((blogPost) => blogPost._id === id);

  const selectedBlogPost = blogPosts[blogPostIndex];

  const selectedAuthorIndex = authors.findIndex(
    (author) => author.name === blogPost.author.name
  );

  const selectedAuthor = authors[selectedAuthorIndex];

  const removedHTMLContent = selectedBlogPost.substr(
    3,
    selectedBlogPost.content.length - 5
  );

  const splitContent = removedHTMLContent.split("\n\n");

  const finalContent = splitContent.map((element) => {
    {
      text: element;
    }
  });

  const data = {
    content: [
      {
        image: "blogPicture",
        width: 450,
      },
      {
        text: selectedBlogPost.title,
        style: "header",
        alignment: "center",
      },
      {
        text: selectedBlogPost.category,
        style: "subheader",
      },
      {
        image: "authorPicture",
        width: 50,
        height: 50,
      },
      {
        text: "By " + selectedAuthor.name + " " + selectedAuthor.surname,
      },
      ...finalContent,
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 15,
        bold: true,
      },
      quote: {
        italics: true,
      },
      small: {
        fontSize: 8,
      },
    },
    images: {
      blogPicture: selectedBlogPost.cover,
      authorPicture: selectedAuthor.avatar,
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(data, {});
  pdfReadableStream.end();

  return pdfReadableStream;
}
