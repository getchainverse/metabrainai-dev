const controller = require("../controllers/doc.controller");

module.exports = function (app) {
  app.post("/api/doc/createdocinfo", controller.createDocInfo);
  app.post("/api/doc/createwebinfo", controller.createWebInfo);
  app.post("/api/doc/getdocinfo", controller.getDocInfo);
  app.post("/api/doc/getwebinfo", controller.getWebInfo);
  app.post("/api/doc/uploaddoc", controller.uploadDoc);
  app.post("/api/doc/getdoccontent", controller.getDocContent);
  app.post("/api/doc/chroma", controller.chroma);
  app.get("/api/doc/getalldocs", controller.getAllDocs);
  app.get("/api/doc/getallwebs", controller.getAllWebs);
  app.post("/api/doc/updatedocroles", controller.updateDocRoles);
  app.post("/api/doc/updatewebroles", controller.updateWebRoles);
};
