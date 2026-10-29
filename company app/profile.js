document.addEventListener("DOMContentLoaded", function () {

  const profileButton =
    document.getElementById("profileButton");

  const profilePanel =
    document.getElementById("profilePanel");

  if (!profileButton || !profilePanel) {
    return;
  }

  // Open / close profile menu
  profileButton.addEventListener("click", function (event) {
    event.stopPropagation();
    profilePanel.classList.toggle("show");
  });

  // Close when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !profilePanel.contains(event.target) &&
      !profileButton.contains(event.target)
    ) {
      profilePanel.classList.remove("show");
    }
  });

});
document.addEventListener("DOMContentLoaded", () => {
  let user;

  try {
    user = JSON.parse(localStorage.getItem("ventrixcarrosUser") || "null");
  } catch {
    user = null;
  }

  if (!user) return;

  const name = user.name || "User";
  const email = user.email || "";
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? words.slice(0, 2).map((word) => word[0]).join("").toUpperCase()
      : name.slice(0, 2).toUpperCase();

  document.querySelectorAll(".avatar-btn, .profile-avatar").forEach((element) => {
    element.textContent = initials;
  });

  const profileHeader = document.querySelector(".profile-header");

  if (profileHeader) {
    const nameElement = profileHeader.querySelector("strong");
    const emailElement = profileHeader.querySelector("span");

    if (nameElement) nameElement.textContent = name;
    if (emailElement) emailElement.textContent = email;
  }
});