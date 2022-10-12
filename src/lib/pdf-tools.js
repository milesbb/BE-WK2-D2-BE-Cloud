import PdfPrinter from "pdfmake";
import { getAuthors, getBlogPosts } from "./fs-tools.js";

export async function createBlogPostPdf(id) {
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };

  const printer = new PdfPrinter(fonts);

  const blogPosts = await getBlogPosts();

  const authors = await getAuthors();

  const blogPostIndex = blogPosts.findIndex((blogPost) => blogPost._id === id);

  const selectedBlogPost = blogPosts[blogPostIndex];

  const selectedAuthorIndex = authors.findIndex(
    (author) => author.name === selectedBlogPost.author.name
  );

  const selectedAuthor = authors[selectedAuthorIndex];

  const removedHTMLContent = selectedBlogPost.content.substr(
    3,
    selectedBlogPost.content.length - 5
  );

  const splitContent = removedHTMLContent.split("\n\n");

  const finalContent = splitContent.map((element) => {
    {
      text: element;
    }
  });

  const docDefinition = {
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
        text: "By " + selectedAuthor.name + " d" + selectedAuthor.surname,
      },

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
    defaultStyle: {
      font: "Helvetica",
    },
    images: {
      blogPicture: selectedBlogPost.cover,
      authorPicture: selectedAuthor.avatar,
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition);
  pdfReadableStream.end();

  return pdfReadableStream;
}
