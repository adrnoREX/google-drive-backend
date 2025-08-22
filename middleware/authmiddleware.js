import { verifyToken } from "./jwt.js";

export const authmiddleware = (req, res, next) => {
  try {
    // 1️⃣ Try Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2️⃣ Fallback: try cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach decoded user info (id + email) to request
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(500).json({ error: "Authentication failed" });
  }
};
