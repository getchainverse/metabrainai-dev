const { authJwt } = require("../middleware");
const controller = require("../controllers/doc.controller");

module.exports = function (app) {
  app.post("/api/doc/createdocinfo", [authJwt.verifyToken], controller.createDocInfo);
  app.post("/api/doc/createwebinfo", [authJwt.verifyToken], controller.createWebInfo);
  app.post("/api/doc/getdocinfo", [authJwt.verifyToken], controller.getDocInfo);
  app.post("/api/doc/getwebinfo", [authJwt.verifyToken], controller.getWebInfo);
  app.post("/api/doc/uploaddoc", [authJwt.verifyToken], controller.uploadDoc);
  app.post("/api/doc/getdoccontent", [authJwt.verifyToken], controller.getDocContent);
  app.post("/api/doc/chroma", [authJwt.verifyToken], controller.chroma);
};
