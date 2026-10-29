document.addEventListener("DOMContentLoaded", function () {

  const notificationButton =
    document.getElementById("notificationButton");

  const notificationPanel =
    document.getElementById("notificationPanel");

  const markNotificationsRead =
    document.getElementById("markNotificationsRead");

  const notificationItems =
    document.querySelectorAll(".notification-item");

  const notificationEmpty =
    document.getElementById("notificationEmpty");

  if (!notificationButton || !notificationPanel) {
    return;
  }

  // Open / close notifications
  notificationButton.addEventListener("click", function (event) {
    event.stopPropagation();
    notificationPanel.classList.toggle("show");
  });

  // Close when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !notificationPanel.contains(event.target) &&
      !notificationButton.contains(event.target)
    ) {
      notificationPanel.classList.remove("show");
    }
  });

  // Mark all notifications as read
  if (markNotificationsRead) {
    markNotificationsRead.addEventListener("click", function () {

      notificationItems.forEach(function (item) {
        item.classList.remove("unread");
        item.style.display = "none";
      });

      if (notificationEmpty) {
        notificationEmpty.style.display = "block";
      }

    });
  }

});