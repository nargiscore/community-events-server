import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks;
const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));
  }
  return jwks;
};

// Verifies the BetterAuth-issued JWT sent as "Authorization: Bearer <token>"
export async function verifyJwt(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Login required: token missing." });
  }
  try {
    const { payload } = await jwtVerify(token, getJwks());
    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      name: payload.name,
    };
    if (!req.user.email) throw new Error("No email in token");
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}
