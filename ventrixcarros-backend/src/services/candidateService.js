const Candidate = require("../models/Candidate");
const User = require("../models/User");

async function getMyProfile(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "candidate") {
    const error = new Error("Candidate account was not found.");
    error.status = 404;
    throw error;
  }

  return Candidate.findOne({
    where: { user_id: userId },
  });
}

async function saveMyProfile(userId, profileData) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "candidate") {
    const error = new Error("Candidate account was not found.");
    error.status = 404;
    throw error;
  }

  const profileFields = {
    name: user.name,
    email: user.email,
    phone: profileData.phone?.trim() || null,
    location: profileData.location?.trim() || null,
    experience: profileData.experience?.trim() || null,
    current_role: profileData.current_role?.trim() || null,
    expected_salary: profileData.expected_salary?.trim() || null,
    resume_url: profileData.resume_url?.trim() || null,
    skills: profileData.skills || [],
  };

  const [profile] = await Candidate.findOrCreate({
    where: { user_id: userId },
    defaults: {
      user_id: userId,
      ...profileFields,
    },
  });

  if (profile) {
    await profile.update(profileFields);
  }

  return profile;
}

module.exports = { getMyProfile, saveMyProfile };