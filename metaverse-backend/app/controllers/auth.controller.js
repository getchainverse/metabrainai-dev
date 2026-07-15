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

// SendGrid throws if given an invalid key; only configure it when present.
if (sendgridAPI && sendgridAPI.startsWith("SG.")) {
  sgMail.setApiKey(sendgridAPI);
}

// Cost factor for password hashing. 12 is the recommended production baseline.
const BCRYPT_ROUNDS = 12;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

exports.signup = async (req, res) => {
  try {
    // --- Input validation ---
    const { username, email, password } = req.body;
    if (!isNonEmptyString(username)) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) {
      return res.status(400).send({ message: "A valid email is required." });
    }
    if (!isNonEmptyString(password) || password.length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }

    const user = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, BCRYPT_ROUNDS),
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
    const { email, password } = req.body;
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res
        .status(400)
        .send({ message: "Email and password are required." });
    }

    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    // Return the same generic error whether the user is missing or the
    // password is wrong, to avoid leaking which emails are registered.
    const passwordIsValid =
      user && bcrypt.compareSync(password, user.password);

    if (!user || !passwordIsValid) {
      return res.status(401).send({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
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
      accessToken: token,
    });
  } catch (error) {
    console.error("signin error:", error.message);
    return res
      .status(500)
      .send({ message: "Authentication failed. Please try again later." });
  }
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({
      message: "You've been signed out!",
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

exports.sendMail = async (req, res) => {
  // Always respond generically so this endpoint cannot be used to discover
  // which emails are registered (prevents user enumeration).
  const genericResponse = () =>
    res.status(200).send({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });

  try {
    const email = req.body.email;
    if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) {
      return res.status(400).send({ message: "A valid email is required." });
    }

    const user = await User.findOne({ where: { email } });

    // Unknown email: return the same generic success without sending mail.
    if (!user) {
      return genericResponse();
    }

    // Include the current password hash timestamp so the token becomes
    // invalid once the password is changed (single-use behaviour).
    const token = jwt.sign(
      { id: user.id, pwdAt: user.expiredTime || "0" },
      config.secret,
      { expiresIn: 86400 } // 24 hours
    );

    const buff = Buffer.from(user.id + " ", "utf-8");
    const base64 = buff.toString("base64");
    const hrefUrl = `${process.env.REACT_APP_FRONTEND_URL}reset-password/${base64}/${token}`;
    const msg = {
      to: user.email,
      from: process.env.MAIL_FROM || "junaidkhalil@virtism.com",
      subject: "you need to reset your password",
      html: `Hello ${email}
      <br>Someone has requested a link to change your password. You can do this through the link below.
      <br><br><a href='${hrefUrl}'>${hrefUrl}</a>
      <br>This link will expire after 24 hours
      <br><br>If you don't request this, please ignore this email.
      <br>Your password won't change until you access the link above and create a new one.`,
    };

    try {
      await sgMail.send(msg);
    } catch (mailErr) {
      // Log server-side but do not reveal delivery details to the caller.
      console.error("Password reset mail failed:", mailErr.message);
    }
    return genericResponse();
  } catch (err) {
    console.error("sendMail error:", err.message);
    return genericResponse();
  }
};

exports.resetPasswordByUser = async (req, res) => {
  try {
    // Verify the reset token from the email link instead of trusting a
    // client-supplied userId. This prevents resetting arbitrary accounts.
    const resetToken = req.body.data.token;
    if (!resetToken) {
      return res.status(401).send({ message: "Missing reset token." });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, config.secret);
    } catch (e) {
      return res.status(401).send({ message: "Invalid or expired reset link." });
    }

    const newPassword = req.body.data.userPassword;
    if (!isNonEmptyString(newPassword) || newPassword.length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }

    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    // Single-use enforcement: the token embeds the password-change marker
    // (pwdAt) captured when the link was issued. If the user's current
    // marker no longer matches, the link has already been used (or the
    // password changed since), so reject it.
    if (String(decoded.pwdAt ?? "0") !== String(user.expiredTime ?? "0")) {
      return res
        .status(401)
        .send({ message: "This reset link has already been used or expired." });
    }

    const passwordIsValid = bcrypt.compareSync(newPassword, user.password);
    if (passwordIsValid) {
      return res.status(400).send({
        success: false,
        accessToken: null,
        message: "Please choose a password different from your current one.",
      });
    }

    user.password = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    // Rotate the marker so the used token (and any other outstanding one)
    // can no longer be replayed.
    user.expiredTime = String(Date.now());
    await user.save();

    return res.send({
      success: true,
      message: "User password updated successfully!",
    });
  } catch (err) {
    console.error("resetPasswordByUser error:", err.message);
    return res.status(500).send({ message: "Unable to reset password." });
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
