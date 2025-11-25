#!/bin/bash
# Post-removal script for Workspace Navigator (DEB package)

set -e

# Update desktop database
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

# Update MIME database
if command -v update-mime-database &> /dev/null; then
    update-mime-database /usr/share/mime 2>/dev/null || true
fi

# Note: We don't remove user data (~/.config/workspace-navigator)
# to preserve user settings and workspaces if they reinstall

echo "Workspace Navigator has been removed."
echo "Note: User data in ~/.config/workspace-navigator was preserved."
echo "To completely remove all data, run: rm -rf ~/.config/workspace-navigator"

exit 0
