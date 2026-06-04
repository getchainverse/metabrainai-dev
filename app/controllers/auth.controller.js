const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const Doc = db.doc;
const Web = db.web;
const Op = db.Sequelize.Op;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const sendgridAPI = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridAPI);

exports.signup = async (req, res) => {
  // Save User to Database
  console.log("req", req);

  try {
    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      companyname: req.body.companyname,
      url: req.body.url,
      firstaddress: req.body.firstaddress,
      secondaddress: req.body.secondaddress,
      country: req.body.country,
      zipcode: req.body.zipcode,
      phone: req.body.phone,
    });

    if (req.body.roles) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles,
          },
        },
      });

      const result = user.setRoles(roles);
      if (result) res.send({ message: "User registered successfully!" });
    } else {
      // user has role = 1
      const result = user.setRoles([1]);
      if (result) res.send({ message: "User registered successfully!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400, // 24 hours
    });

    let authorities = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }

    req.session.token = token;

    return res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!",
    });
  } catch (err) {
    this.next(err);
  }
};

exports.sendMail = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("email", req.body.email);
    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    let authorities = [];

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      authorities.push("ROLE_" + roles[i].name.toUpperCase());
    }

    let buff = Buffer.from(user.id + " ", "utf-8");
    let base64 = buff.toString("base64");
    const hrefUrl = `${process.env.REACT_APP_FRONTEND_URL}reset-password/${base64}/${token}`;
    const msg = {
      to: req.body.email,
      from: "junaidkhalil@virtism.com",
      subject: "you need to reset your password",
      html: `Hello ${email}
      <br>Someone has requested a link to change your password. You can do this through the link below.
      <br><br><a href='${hrefUrl}'>${hrefUrl}</a>
      <br>This link will expire after 24 hours
      <br><br>If you don't request this, please ignore this email.
      <br>Your password won't change until you access the link above and create a new one.`,
    };
    sgMail
      .send(msg)
      .then((response) => {
        console.log(">>>>>mail-success");
        res.status(200).send({ message: "Email Send Succesfully" });
      })
      .catch((err) => {
        console.log(">>>>>mail-error");
        res.status(500).send({ message: err.message });
      });
  } catch (err) {
    console.log(">>>>>mail-error");
    return res.status(500).send({ message: err.message });
  }
};

exports.resetPasswordByUser = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.body.data.userId } });
    const passwordIsValid = bcrypt.compareSync(
      req.body.data.userPassword,
      user.password
    );
    if (passwordIsValid) {
      return res.status(401).send({
        success: false,
        accessToken: null,
        message: "Use different password not use your old password!",
      });
    } else {
      user.password = bcrypt.hashSync(req.body.data.userPassword, 8);
      user.expiredTime = req.body.data.expiredTime;
      user.save().then(function (result) {
        return res.send({
          success: true,
          message: "User password updated successfully!",
        });
      });
    }
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.getLastExpiredTime = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.body.data.id } });
    return res.send({ expiredTime: user.expiredTime });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.getAllUserData = async (req, res) => {
  try {
    const users = await User.findAll();
    const AllUser = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const roles = await user.getRoles();
      let roleIds = [];

      const authorities = roles.map(
        (role) => `ROLE_${role.name.toUpperCase()}`
      );

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

      const docInfos = await Doc.findAll({
        where: {
          id: {
            [Op.in]: docIds,
          },
        },
      });

      const webInfos = await Web.findAll({
        where: {
          id: {
            [Op.in]: webIds,
          },
        },
      });

      AllUser.push({
        username: user.username,
        email: user.email,
        roles: authorities,
        docInfos: docInfos,
        webInfos: webInfos,
      });
    }
    res.send(AllUser);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.setRoleByUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    let roleArray = [];
    roleArray.push(req.body.role);
    if (req.body.role) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: roleArray,
          },
        },
      });
      const result = user.setRoles(roles);
      if (result) {
        res.send({ message: "User registered successfully!" });
      }
    } else {
      // user has role = 1
      const result = user.setRoles([1]);
      if (result) res.send({ message: "User registered successfully!" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
