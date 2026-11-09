(() => {
  const button = document.getElementById("notificationButton");
  if (!button) return;

  let panel;
  const styles = document.createElement("style");
  styles.textContent = `
    .admin-notification-panel{position:fixed;top:76px;right:24px;z-index:2000;width:min(380px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;background:#fff;border:1px solid #dce3f2;border-radius:16px;box-shadow:0 18px 48px rgba(15,28,70,.18);padding:18px;color:#10183f}
    .admin-notification-panel h2{font-size:18px;margin:0 0 4px}
    .admin-notification-panel p{color:#64748b;margin:0 0 14px;font-size:13px}
    .admin-notification-item{padding:12px 0;border-top:1px solid #e7ebf4;font-size:14px;line-height:1.45}
    .admin-notification-item small{display:block;color:#718096;margin-top:5px}
    .admin-notification-close{float:right;border:0;background:#f1f5fb;border-radius:8px;padding:5px 9px;cursor:pointer}
  `;
  document.head.appendChild(styles);

  function closePanel() {
    panel?.remove();
    panel = null;
    button.setAttribute("aria-expanded", "false");
  }

  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", async () => {
    if (panel) {
      closePanel();
      return;
    }

    panel = document.createElement("section");
    panel.className = "admin-notification-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Platform notifications");

    const close = document.createElement("button");
    close.className = "admin-notification-close";
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", closePanel);

    const heading = document.createElement("h2");
    heading.textContent = "Platform notifications";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Recent companies, payments, and support activity.";
    const list = document.createElement("div");
    list.textContent = "Loading notifications…";

    panel.append(close, heading, subtitle, list);
    document.body.appendChild(panel);
    button.setAttribute("aria-expanded", "true");

    const token = localStorage.getItem("ventrixcarrosToken");
    if (!token) {
      list.textContent = "Please sign in again to view notifications.";
      return;
    }

    try {
      const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not load notifications.");

      const notifications = Array.isArray(data.notifications) ? data.notifications : [];
      list.replaceChildren();
      if (!notifications.length) {
        list.textContent = "No new admin notifications.";
        return;
      }

      for (const item of notifications) {
        const row = document.createElement("div");
        row.className = "admin-notification-item";
        const message = document.createElement("div");
        message.textContent = String(item.message || "Platform activity");
        const time = document.createElement("small");
        const date = new Date(item.createdAt);
        time.textContent = Number.isNaN(date.getTime()) ? "Recent activity" : date.toLocaleString();
        row.append(message, time);
        list.appendChild(row);
      }
    } catch (error) {
      list.textContent = error.message || "Could not load notifications.";
    }
  });

  document.addEventListener("click", (event) => {
    if (panel && !panel.contains(event.target) && !button.contains(event.target)) closePanel();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel) closePanel();
  });
})();
