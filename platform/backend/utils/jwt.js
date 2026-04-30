const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

exports.generateToken = (user) => {
    return jwt.sign({ id: user.id }, SECRET, { expiresIn: "1h" });
};