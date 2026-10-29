from pathlib import Path
import re
import shutil

# Current project folder
folder = Path(__file__).parent

# Professional SVG icons
icons = {
    "🏠": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="3" width="7" height="7" rx="1"></rect>
<rect x="14" y="3" width="7" height="7" rx="1"></rect>
<rect x="3" y="14" width="7" height="7" rx="1"></rect>
<rect x="14" y="14" width="7" height="7" rx="1"></rect>
</svg>""",

    "🤖": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="8" r="3"></circle>
<path d="M5 21v-2a7 7 0 0 1 14 0v2"></path>
<path d="M19 5l1 1"></path>
<path d="M20 4l-1 1"></path>
</svg>""",

    "💼": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="7" width="18" height="13" rx="2"></rect>
<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
<path d="M3 12h18"></path>
<path d="M10 12v2h4v-2"></path>
</svg>""",

    "👥": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="9" cy="8" r="3"></circle>
<path d="M3 20v-2a6 6 0 0 1 12 0v2"></path>
<circle cx="17" cy="9" r="2.5"></circle>
<path d="M16 15a5 5 0 0 1 5 5"></path>
</svg>""",

    "📋": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="5" y="3" width="14" height="18" rx="2"></rect>
<path d="M9 3v3h6V3"></path>
<path d="M8 12l2 2 4-4"></path>
</svg>""",

    "⭐": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="8" r="3"></circle>
<path d="M5 21v-2a7 7 0 0 1 14 0v2"></path>
<path d="M19 3l.6 1.2L21 4.4l-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2L19 3z"></path>
</svg>""",

    "🎤": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="8" y="3" width="8" height="12" rx="4"></rect>
<path d="M5 11a7 7 0 0 0 14 0"></path>
<path d="M12 18v3"></path>
<path d="M9 21h6"></path>
</svg>""",

    "💬": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-3-.5L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5z"></path>
</svg>""",

    "📊": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M4 19V5"></path>
<path d="M4 19h17"></path>
<path d="M7 15l4-4 3 2 5-6"></path>
<path d="M16 7h3v3"></path>
</svg>""",

    "💳": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="5" width="18" height="14" rx="2"></rect>
<path d="M3 10h18"></path>
<path d="M7 15h4"></path>
</svg>""",

    "🏢": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path>
<path d="M2 21h20"></path>
<path d="M8 7h2"></path>
<path d="M8 11h2"></path>
<path d="M8 15h2"></path>
<path d="M16 9h2"></path>
<path d="M16 13h2"></path>
<path d="M16 17h2"></path>
</svg>""",

    "⚙️": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="12" r="3"></circle>
<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5H15v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.4V14h-.4a1.7 1.7 0 0 0-1.6 1z"></path>
</svg>"""
}

# Update every HTML file in this folder
for file in folder.glob("*.html"):

    # Backup before changing
    backup = file.with_suffix(".html.backup")
    if not backup.exists():
        shutil.copy2(file, backup)

    text = file.read_text(encoding="utf-8")

    original = text

    # Replace only emoji inside nav-icon spans
    for emoji, svg in icons.items():
        pattern = rf'<span\s+class="nav-icon">\s*{re.escape(emoji)}\s*</span>'

        replacement = f'''<span class="nav-icon">
{svg}
</span>'''

        text = re.sub(pattern, replacement, text)

    # Update old nav-icon CSS if present
    old_css = """\
.nav-icon {
  width: 22px;
  text-align: center;
  font-size: 16px;
}"""

    new_css = """\
.nav-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 19px;
  height: 19px;
  display: block;
}"""

    text = text.replace(old_css, new_css)

    if text != original:
        file.write_text(text, encoding="utf-8")
        print("Updated:", file.name)

print("\nDONE! All HTML pages have been updated.")
print("Backup files were also created automatically.")