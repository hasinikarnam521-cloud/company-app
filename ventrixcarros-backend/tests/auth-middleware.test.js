const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const secret = "test-only-secret-for-middleware-tests";
process.env.JWT_SECRET = secret;

const authenticateToken = require("../src/middleware/auth");
const allowRoles = require("../src/middleware/roles");

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

function requestWithToken(token) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {} };
}

test("auth rejects a missing bearer token", () => {
  const req = requestWithToken();
  const res = responseMock();
  let calledNext = false;

  authenticateToken(req, res, () => { calledNext = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(calledNext, false);
});

test("auth rejects an invalid token", () => {
  const req = requestWithToken("not-a-valid-token");
  const res = responseMock();
  let calledNext = false;

  authenticateToken(req, res, () => { calledNext = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(calledNext, false);
});

test("auth rejects a signup payment token on ordinary protected routes", () => {
  const token = jwt.sign({ sub: 7, role: "recruiter", purpose: "signup_payment" }, secret);
  const req = requestWithToken(token);
  const res = responseMock();
  let calledNext = false;

  authenticateToken(req, res, () => { calledNext = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(calledNext, false);
});

test("auth attaches the verified user and continues", () => {
  const token = jwt.sign({ sub: 7, role: "recruiter" }, secret);
  const req = requestWithToken(token);
  const res = responseMock();
  let calledNext = false;

  authenticateToken(req, res, () => { calledNext = true; });

  assert.deepEqual(req.user, { id: 7, role: "recruiter" });
  assert.equal(calledNext, true);
});

test("role middleware rejects users without an allowed role", () => {
  const req = { user: { id: 7, role: "candidate" } };
  const res = responseMock();
  let calledNext = false;

  allowRoles("admin")(req, res, () => { calledNext = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(calledNext, false);
});

test("role middleware allows an authorized recruiter", () => {
  const req = { user: { id: 7, role: "recruiter" } };
  const res = responseMock();
  let calledNext = false;

  allowRoles("recruiter")(req, res, () => { calledNext = true; });

  assert.equal(calledNext, true);
});

test("admin middleware denies a recruiter", () => {
  const adminOnly = require("../src/middleware/adminOnly");
  const req = { user: { id: 7, role: "recruiter" } };
  const res = responseMock();
  let calledNext = false;
  adminOnly(req, res, () => { calledNext = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(calledNext, false);
});

test("admin middleware allows an admin", () => {
  const adminOnly = require("../src/middleware/adminOnly");
  const req = { user: { id: 1, role: "admin" } };
  const res = responseMock();
  let calledNext = false;
  adminOnly(req, res, () => { calledNext = true; });
  assert.equal(calledNext, true);
});
