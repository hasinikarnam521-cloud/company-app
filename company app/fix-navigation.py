from pathlib import Path
import re
import shutil

# Folder where this Python file is located
PROJECT = Path(__file__).parent

# Sidebar page names and their HTML files
PAGE_LINKS = {
    "Dashboard": "dashboard.html",
    "AI Recruitment": "ai-recruitment.html",
    "Jobs": "jobs.html",
    "Candidates": "candidates.html",
    "Applications": "applications.html",
    "Shortlisted": "shortlisted.html",
    "Interviews": "interviews.html",
    "Messages": "messages.html",
    "Analytics": "analytics.html",
    "Subscription": "subscription.html",
    "Company Profile": "company-profile.html",
    "Settings": "settings.html",
    "Logout": "index.html",
}

# Pages to update
HTML_FILES = [
    "dashboard.html",
    "ai-recruitment.html",
    "jobs.html",
    "candidates.html",
    "applications.html",
    "shortlisted.html",
    "interviews.html",
    "messages.html",
    "analytics.html",
    "subscription.html",
    "company-profile.html",
    "settings.html",
    "job-detail.html",
]

def clean_text(text):
    """Remove HTML tags and extra whitespace."""
    text = re.sub(r"<[^>]+>", "", text)
    return " ".join(text.split())

def fix_sidebar(content):
    """
    Convert sidebar nav items that are <div> elements
    into proper clickable <a> elements.

    Existing <a> elements are left untouched.
    SVG/icon HTML inside the item is preserved.
    """

    # Match only nav-item div blocks.
    # This intentionally handles the sidebar items, not normal page divs.
    pattern = re.compile(
        r'<div\s+class="nav-item(?:\s+active)?"[^>]*>(.*?)</div>',
        re.DOTALL | re.IGNORECASE
    )

    changes = 0

    def replace(match):
        nonlocal changes

        full_inner = match.group(1)

        # Get visible text while ignoring SVG/icon markup
        text = clean_text(full_inner)

        # Remove common icon text if present
        for icon in ["🏠", "🤖", "💼", "👥", "📋", "⭐", "🎤",
                     "💬", "📊", "💳", "🏢", "⚙️", "🚪"]:
            text = text.replace(icon, "").strip()

        # Match exact sidebar item
        if text not in PAGE_LINKS:
            return match.group(0)

        href = PAGE_LINKS[text]

        # Preserve active class if it exists
        original = match.group(0)
        active = " active" if re.search(
            r'class="nav-item\s+active"', original, re.IGNORECASE
        ) else ""

        changes += 1

        return f'<a href="{href}" class="nav-item{active}">{full_inner}</a>'

    new_content = pattern.sub(replace, content)

    return new_content, changes


print("\n======================================")
print(" VentrixCarros Navigation Fix")
print("======================================\n")

total_changes = 0

for filename in HTML_FILES:
    file_path = PROJECT / filename

    if not file_path.exists():
        print(f"SKIPPED: {filename} (not found)")
        continue

    # Create backup only once
    backup_path = file_path.with_suffix(file_path.suffix + ".navbackup")

    if not backup_path.exists():
        shutil.copy2(file_path, backup_path)

    content = file_path.read_text(encoding="utf-8")

    new_content, changes = fix_sidebar(content)

    if changes > 0:
        file_path.write_text(new_content, encoding="utf-8")
        print(f"UPDATED: {filename}  ({changes} navigation item(s))")
        total_changes += changes
    else:
        print(f"OK:      {filename}  (no changes needed)")

print("\n======================================")
print(f"Total navigation items fixed: {total_changes}")
print("======================================")

print("\nBackups were created with:")
print("*.html.navbackup")

print("\nNow test:")
print("Dashboard -> Interviews")
print("Interviews -> Jobs")
print("Jobs -> Candidates")
print("Candidates -> Applications")
print("Applications -> Analytics")
print("Analytics -> Dashboard")