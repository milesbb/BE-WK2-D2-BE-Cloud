import express from "express";
import authorsRouter from "./api/authors/index.js";
import listEndpoints from "express-list-endpoints";
import cors from "cors"

const server = express();
const port = 3004;

server.use(express.json());

server.use("/authors", authorsRouter);

server.use(cors())

server.listen(port, () => {
  console.table(listEndpoints(server));
  console.log("Server is up and running on port " + port);
});
