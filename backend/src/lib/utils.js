import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Remove this code as it's after the return statement and never runs
  // res.cookie("jwt", token, {
  //   maxAge: 7 * 24 * 60 * 60 * 1000,
  //   httpOnly: true,
  //   sameSite: "none",
  //   secure: true,
  //   domain: process.env.NODE_ENV === "production" ? ".onrender.com" : "localhost"
  // });

  return token;
};
