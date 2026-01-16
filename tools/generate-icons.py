#!/usr/bin/env python3
"""
Icon Generator Script

Compresses and resizes a source image into all required app icon formats.

Usage: python tools/generate-icons.py <path-to-source-image>
Example: python tools/generate-icons.py ~/Downloads/my-logo.png

Requirements: pip install Pillow
"""

import sys
import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ASSETS_DIR = PROJECT_DIR / "assets"

OUTPUTS = [
    {
        "name": "icon.png",
        "size": 1024,
        "padding": 0,
        "description": "Main app icon (iOS & Android)",
    },
    {
        "name": "adaptive-icon.png",
        "size": 1024,
        "padding": 0.2,  # 20% padding on each side for Android adaptive icon
        "description": "Android adaptive icon (with safe zone padding)",
    },
    {
        "name": "splash-icon.png",
        "size": 512,
        "padding": 0,
        "description": "Splash screen icon",
    },
    {
        "name": "favicon.png",
        "size": 48,
        "padding": 0,
        "description": "Web favicon",
    },
]


def generate_icons(source_path: str):
    source = Path(source_path).expanduser()

    # Validate source file
    if not source.exists():
        print(f"Error: Source file not found: {source}")
        sys.exit(1)

    # Get source file info
    source_size_mb = source.stat().st_size / (1024 * 1024)
    print(f"\nSource: {source}")
    print(f"Original size: {source_size_mb:.2f} MB\n")

    # Open source image
    img = Image.open(source)

    # Convert to RGBA if necessary
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    print(f"Image dimensions: {img.width}x{img.height}\n")

    # Ensure assets directory exists
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # Process each output
    for output in OUTPUTS:
        output_path = ASSETS_DIR / output["name"]
        size = output["size"]
        padding = output["padding"]

        try:
            if padding > 0:
                # Create image with padding (for Android adaptive icon)
                inner_size = int(size * (1 - padding * 2))

                # Resize the icon
                resized = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)

                # Create transparent canvas
                canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

                # Paste icon in center
                offset = int(size * padding)
                canvas.paste(resized, (offset, offset), resized)

                result = canvas
            else:
                # Standard resize
                result = img.resize((size, size), Image.Resampling.LANCZOS)

            # Save with optimization
            result.save(
                output_path,
                "PNG",
                optimize=True,
                compress_level=9,
            )

            # Get output file size
            output_size_kb = output_path.stat().st_size / 1024

            print(f"✓ {output['name']} ({size}x{size}) - {output_size_kb:.1f} KB")
            print(f"  {output['description']}\n")

        except Exception as e:
            print(f"✗ Failed to generate {output['name']}: {e}\n")

    print(f"Done! Icons saved to: {ASSETS_DIR}")
    print("\nNext steps:")
    print("1. Check the generated icons in the assets folder")
    print("2. Run your app to see the new icons")
    print("3. Rebuild with: eas build --profile preview --platform all")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tools/generate-icons.py <path-to-source-image>")
        print("Example: python tools/generate-icons.py ~/Downloads/logo.png")
        sys.exit(1)

    generate_icons(sys.argv[1])
