const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/User");
const Job = require("../src/models/Job");
const Subscription = require("../src/models/Subscription");
const jobService = require("../src/services/jobService");

function replace(target, key, replacement, t) {
  const original = target[key];
  target[key] = replacement;
  t.after(() => { target[key] = original; });
}

test("job creation rejects a recruiter without a linked company", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, role: "recruiter", company_id: null }), t);
  let createCalled = false;
  replace(Job, "create", async () => { createCalled = true; }, t);

  await assert.rejects(
    jobService.createJob(4, { title: "Engineer", description: "Build systems" }),
    (error) => error.status === 403
  );
  assert.equal(createCalled, false);
});

test("recruiters can only receive their own company's jobs", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, role: "recruiter", company_id: 20 }), t);
  let query;
  replace(Job, "findAll", async (options) => { query = options; return []; }, t);

  await jobService.listCompanyJobs(4);

  assert.deepEqual(query.where, { company_id: 20 });
});

test("job status changes reject a job owned by another company", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, role: "recruiter", company_id: 20 }), t);
  replace(Job, "findByPk", async () => ({ id: 8, company_id: 21, status: "draft" }), t);

  await assert.rejects(
    jobService.updateJobStatus(4, 8, "active"),
    (error) => error.status === 403 && /another company's job/.test(error.message)
  );
});

test("job activation respects the active-job limit on the company plan", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, role: "recruiter", company_id: 20 }), t);
  let updated = false;
  replace(Job, "findByPk", async () => ({
    id: 8,
    company_id: 20,
    status: "draft",
    update: async () => { updated = true; },
  }), t);
  replace(Subscription, "findOne", async () => ({ plan: { max_active_jobs: 1 } }), t);
  replace(Job, "count", async () => 1, t);

  await assert.rejects(
    jobService.updateJobStatus(4, 8, "active"),
    (error) => error.status === 403 && /allows up to 1 active jobs/.test(error.message)
  );
  assert.equal(updated, false);
});
