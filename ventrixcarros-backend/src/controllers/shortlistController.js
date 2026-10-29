const shortlistService = require("../services/shortlistService");

async function addToShortlist(req, res, next) {
  try {
    const entry = await shortlistService.addToShortlist(
      req.user.id,
      Number(req.params.jobId),
      Number(req.body.candidateId)
    );

    res.status(201).json({
      success: true,
      message: "Candidate added to shortlist.",
      entry,
    });
  } catch (error) {
    next(error);
  }
}

async function listShortlist(req, res, next) {
  try {
    const entries = await shortlistService.listShortlist(req.user.id);

    res.json({
      success: true,
      entries,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { addToShortlist, listShortlist };