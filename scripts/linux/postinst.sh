#!/bin/bash
# Post-installation script for Workspace Navigator (DEB package)

set -e

# Update desktop database for application menu integration
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database -q /usr/share/applications 2>/dev/null || true
fi

# Update icon cache
if command -v gtk-update-icon-cache &> /dev/null; then
    for theme_dir in /usr/share/icons/hicolor; do
        if [ -d "$theme_dir" ]; then
            gtk-update-icon-cache -f -t "$theme_dir" 2>/dev/null || true
        fi
    done
fi

# Update MIME database for file associations
if command -v update-mime-database &> /dev/null; then
    update-mime-database /usr/share/mime 2>/dev/null || true
fi

# Register as default handler for markdown files (optional, user can override)
if command -v xdg-mime &> /dev/null; then
    # Don't force as default, just register capability
    echo "Workspace Navigator installed. You can set it as default for markdown files in your system settings."
fi

echo "Workspace Navigator has been installed successfully!"
echo "You can find it in your application menu or run 'workspace-navigator' from the terminal."

exit 0
