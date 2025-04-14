import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none", // Change from "strict" to "none"
    secure: true, // Must be true when sameSite is "none"
    domain: process.env.NODE_ENV === "production" ? ".onrender.com" : "localhost"
  });

  return token;
};