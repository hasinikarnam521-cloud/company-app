const aiService = require("../services/aiService");
const aiToolsService = require("../services/aiToolsService");

async function screenCandidates(req, res, next) {
  try {
    const result = await aiService.screenCandidates(
      req.user.id,
      Number(req.body.jobId)
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function generateJobDescription(req, res, next) {
  try {
    const description = await aiToolsService.generateJobDescription(
      req.user.id,
      {
        ...req.body,
        jobTitle: req.body.title,
      }
    );

    res.json({ success: true, description });
  } catch (error) {
    next(error);
  }
}
async function generateInterviewQuestions(req, res, next) {
  try {
    const questions = await aiToolsService.generateInterviewQuestions(
      req.user.id,
      Number(req.body.jobId),
      req.body.questionCount
    );

    res.json({ success: true, questions });
  } catch (error) {
    next(error);
  }
}

async function analyzeSkillGap(req, res, next) {
  try {
    const analysis = await aiToolsService.analyzeSkillGap(
      req.user.id,
      Number(req.body.jobId),
      Number(req.body.candidateId)
    );

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
}

async function checkJobDescriptionBias(req, res, next) {
  try {
    const review = await aiToolsService.checkJobDescriptionBias(
      req.user.id,
      Number(req.body.jobId)
    );

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
}

async function optimizeHiringWorkflow(req, res, next) {
  try {
    const result = await aiToolsService.optimizeHiringWorkflow(req.user.id);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  screenCandidates,
  generateJobDescription,
  generateInterviewQuestions,
  analyzeSkillGap,
  checkJobDescriptionBias,
  optimizeHiringWorkflow,
};