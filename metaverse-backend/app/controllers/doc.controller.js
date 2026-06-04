const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { ChromaClient } = require("chromadb");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Chroma } = require("langchain/vectorstores/chroma");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");

// const { pipeline, env } = require("@xenova/transformers");
const User = db.user;
const Doc = db.doc;
const Role = db.role;
const Web = db.web;
const Op = db.Sequelize.Op;

const client = new ChromaClient({
  path: "api/doc/chroma",
});

var upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  fileFilter: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "..", "public");
    const filePath = path.join(uploadDir, file.originalname);

    // check if the file already exists in the "public" directory
    if (fs.existsSync(filePath)) {
      const err = new Error(
        `File ${file.originalname} already uploaded - Please change the file name`
      );
      err.code = "DUPLICATE_FILE";
      return cb(err);
    }

    cb(null, true);
  },
});

const initPinecone = async () => {
  try {
    const pinecone = new PineconeClient();

    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT ?? "", //this is in the dashboard
      apiKey: process.env.PINECONE_API_KEY ?? "",
    });

    return pinecone;
  } catch (error) {
    console.log("error", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
};

const getDocsContent = async (docPath, text_splitter) => {
  console.log("docPath", docPath);
  const publicPath = path.join(__dirname, "..", "..", "public");
  const filePath = path.join(publicPath, docPath);
  // const readFileSync = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  let loader;
  switch (ext) {
    case ".pdf":
      loader = new PDFLoader(filePath);
      break;
    case ".PDF":
      loader = new PDFLoader(filePath);
      break;
    case ".docx":
      loader = new DocxLoader(filePath);
      break;

    default:
      break;
  }
  const rawDocs = await loader.load();
  console.log("docsContent", rawDocs);
  // const docsContent = await text_splitter.splitDocuments(rawDocs);
  // console.log("docsContent", docsContent);
  return rawDocs;
};
exports.createDocInfo = async (req, res) => {
  try {
    const doc = await Doc.create({
      basename: req.body.basename,
      description: req.body.description,
      filepath: req.body.fileUrl,
      filename: req.body.fileName,
    });

    const roles = await Role.findAll({
      where: {
        name: {
          [Op.or]: req.body.permission,
        },
      },
      attributes: ["id"],
    });

    const roleIds = roles.map((role) => role.id);
    console.log("rolIds>>>>>>>>>>>>>>", roleIds);
    const result = doc.setRoles(roles);
    if (result) {
      if (result) res.send({ message: "Create permission successfully!" });
    } else {
      const result = doc.setRoles([1]);
      if (result) res.send({ message: "Create permission successfully!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getDocInfo = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const roles = await user.getRoles();
    let roleIds = [];
    for (let i = 0; i < roles.length; i++) {
      roleIds.push(roles[i].id);
    }

    const docIds = await Doc.findAndCountAll({
      include: [
        {
          model: Role,
          where: {
            id: {
              [Op.in]: roleIds,
            },
          },
          attributes: [],
        },
      ],
      attributes: ["id"],
    }).then((result) => result.rows.map((doc) => doc.id));

    const docInfos = await Doc.findAll({
      where: {
        id: {
          [Op.in]: docIds,
        },
      },
    });
    // let docsName = [];
    // let docsContent = [];
    // docInfos.forEach((item) => {
    //   if (!docsName.includes(item.dataValues.filename))
    //     docsName.push(item.dataValues.filename);
    // });
    // console.log("docsName", docsName);

    // const textSplitter = new RecursiveCharacterTextSplitter({
    //   chunkSize: 1000,
    //   chunkOverlap: 200,
    // });

    res.send({ message: docInfos });
  } catch (error) {
    res.send({ message: "Get Doc failed!" });
  }
};

exports.getDocContent = async (req, res) => {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1024,
      chunkOverlap: 64,
    });
    let docContent = await getDocsContent(req.body.filename, textSplitter);
    res.send({ message: docContent });
  } catch (error) {}
};

exports.createWebInfo = async (req, res) => {
  try {
    const paths = await Web.findAll({ attributes: ["path"] });
    const pathValues = paths.map((path) => path.path);
    if (pathValues.includes(req.body.weburl))
      res.status(500).send({ message: "The url already exists" });
    else {
      console.log("pathValues", pathValues);
      const web = await Web.create({
        path: req.body.weburl,
        index: req.body.pagecount,
        basename: req.body.basename,
        description: req.body.description,
      });
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.permission,
          },
        },
        attributes: ["id"],
      });
      const roleIds = roles.map((role) => role.id);
      console.log("rolIds>>>>>>>>>>>>>>", roleIds);
      const result = web.setRoles(roles);
      if (result) {
        if (result) res.send({ message: "Create permission successfully!" });
      } else {
        const result = web.setRoles([1]);
        if (result) res.send({ message: "Create permission successfully!" });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getWebInfo = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const roles = await user.getRoles();
    let roleIds = [];
    for (let i = 0; i < roles.length; i++) {
      roleIds.push(roles[i].id);
    }

    const webIds = await Web.findAndCountAll({
      include: [
        {
          model: Role,
          where: {
            id: {
              [Op.in]: roleIds,
            },
          },
          attributes: [],
        },
      ],
      attributes: ["id"],
    }).then((result) => result.rows.map((web) => web.id));

    const webInfos = await Web.findAll({
      where: {
        id: {
          [Op.in]: webIds,
        },
      },
    });
    res.send({ message: webInfos });
  } catch (error) {
    res.send({ message: "Get Doc failed!" });
  }
};

exports.uploadDoc = (req, res) => {
  console.log("reqresponse", req);
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      // handle error
      if (err.code === "DUPLICATE_FILE") {
        // handle duplicate file error
        console.log("errorRespnose", err.message);
        return res.status(409).send(err.message);
      }
      console.log("errorRespnose", err);
      return res.status(500).send(err);
    }

    // the uploaded file will be available in the req.file object
    console.log(req.file);
    res.json({ file: `public/${req.file.filename}` });
  });
};

exports.chroma = (req, res) => {
  console.log("req", req);
};
