const jwt = require("jsonwebtoken");

function authenticatePaymentToken(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Payment authorization is required." });
  }

  try {
    const decoded = jwt.verify(authorization.slice("Bearer ".length), process.env.JWT_SECRET);
    if (decoded.role !== "recruiter" || (decoded.purpose && decoded.purpose !== "signup_payment")) {
      return res.status(403).json({ success: false, message: "A recruiter account is required for payment." });
    }
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Payment authorization is invalid or expired. Please sign in again." });
  }
}

module.exports = authenticatePaymentToken;
