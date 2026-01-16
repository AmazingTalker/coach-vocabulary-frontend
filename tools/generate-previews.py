#!/usr/bin/env python3
"""
App Store Preview Image Generator

Generates App Store preview images from app screenshots.

Usage: python tools/generate-previews.py

Requirements: pip install Pillow

Before running:
1. Place your screenshots in tools/screenshots/
2. Name them: 01.png, 02.png, 03.png, 04.png
3. Run the script
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


# === CONFIGURATION ===

# Paths
SCRIPT_DIR = Path(__file__).parent
SCREENSHOTS_DIR = SCRIPT_DIR / "screenshots"
OUTPUT_DIR = SCRIPT_DIR / "previews"

# Output dimensions (iPhone 6.7")
OUTPUT_WIDTH = 1290
OUTPUT_HEIGHT = 2796

# Brand colors
BACKGROUND_COLOR = "#2db877"
TEXT_COLOR = "#FFFFFF"

# Layout settings
SCREENSHOT_WIDTH_RATIO = 0.85  # Screenshot width as ratio of output width
SCREENSHOT_TOP_RATIO = 0.28    # Screenshot top position as ratio of output height
TITLE_TOP_RATIO = 0.08         # Title top position
SUBTITLE_TOP_RATIO = 0.16      # Subtitle top position

# Font sizes
TITLE_FONT_SIZE = 72
SUBTITLE_FONT_SIZE = 42

# Preview configurations
PREVIEWS = [
    {
        "input": "01.png",
        "output": "preview_01_home.png",
        "title": "30 分鐘背 50 個單字",
        "subtitle": "高效學習，輕鬆記住",
    },
    {
        "input": "02.png",
        "output": "preview_02_learn.png",
        "title": "學習新單字",
        "subtitle": "圖片 + 發音 + 翻譯",
    },
    {
        "input": "03.png",
        "output": "preview_03_practice.png",
        "title": "閱讀練習",
        "subtitle": "看單字，選翻譯",
    },
    {
        "input": "04.png",
        "output": "preview_04_speaking.png",
        "title": "口說練習",
        "subtitle": "AI 語音辨識",
    },
]


def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_font(size: int) -> ImageFont.FreeTypeFont:
    """Get a font, falling back to default if custom font not available."""
    # Try common system fonts for Chinese support
    font_paths = [
        # macOS
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        # Fallback
        "/System/Library/Fonts/Helvetica.ttc",
    ]

    for font_path in font_paths:
        if Path(font_path).exists():
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                continue

    # Ultimate fallback
    print("Warning: Using default font (Chinese characters may not render correctly)")
    return ImageFont.load_default()


def create_preview(config: dict) -> bool:
    """Create a single preview image."""
    input_path = SCREENSHOTS_DIR / config["input"]
    output_path = OUTPUT_DIR / config["output"]

    # Check input exists
    if not input_path.exists():
        print(f"  ✗ Input not found: {input_path}")
        return False

    try:
        # Create canvas with background color
        bg_color = hex_to_rgb(BACKGROUND_COLOR)
        canvas = Image.new("RGB", (OUTPUT_WIDTH, OUTPUT_HEIGHT), bg_color)
        draw = ImageDraw.Draw(canvas)

        # Load and resize screenshot
        screenshot = Image.open(input_path)

        # Convert to RGB if necessary (handle RGBA)
        if screenshot.mode == "RGBA":
            # Create white background for transparency
            bg = Image.new("RGB", screenshot.size, (255, 255, 255))
            bg.paste(screenshot, mask=screenshot.split()[3])
            screenshot = bg
        elif screenshot.mode != "RGB":
            screenshot = screenshot.convert("RGB")

        # Calculate screenshot size (maintain aspect ratio)
        target_width = int(OUTPUT_WIDTH * SCREENSHOT_WIDTH_RATIO)
        aspect_ratio = screenshot.height / screenshot.width
        target_height = int(target_width * aspect_ratio)

        # Cap height if too tall
        max_height = int(OUTPUT_HEIGHT * 0.65)
        if target_height > max_height:
            target_height = max_height
            target_width = int(target_height / aspect_ratio)

        screenshot = screenshot.resize((target_width, target_height), Image.Resampling.LANCZOS)

        # Add rounded corners to screenshot
        screenshot = add_rounded_corners(screenshot, radius=40)

        # Position screenshot
        x = (OUTPUT_WIDTH - target_width) // 2
        y = int(OUTPUT_HEIGHT * SCREENSHOT_TOP_RATIO)

        # Paste screenshot (handle transparency from rounded corners)
        canvas.paste(screenshot, (x, y), screenshot if screenshot.mode == "RGBA" else None)

        # Add title
        title_font = get_font(TITLE_FONT_SIZE)
        title = config["title"]
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (OUTPUT_WIDTH - title_width) // 2
        title_y = int(OUTPUT_HEIGHT * TITLE_TOP_RATIO)
        draw.text((title_x, title_y), title, fill=TEXT_COLOR, font=title_font)

        # Add subtitle
        subtitle_font = get_font(SUBTITLE_FONT_SIZE)
        subtitle = config["subtitle"]
        subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        subtitle_x = (OUTPUT_WIDTH - subtitle_width) // 2
        subtitle_y = int(OUTPUT_HEIGHT * SUBTITLE_TOP_RATIO)
        draw.text((subtitle_x, subtitle_y), subtitle, fill=TEXT_COLOR, font=subtitle_font)

        # Save
        canvas.save(output_path, "PNG", quality=95, optimize=True)

        # Get file size
        size_kb = output_path.stat().st_size / 1024
        print(f"  ✓ {config['output']} ({size_kb:.0f} KB)")
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def add_rounded_corners(image: Image.Image, radius: int) -> Image.Image:
    """Add rounded corners to an image."""
    # Create mask
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), image.size], radius=radius, fill=255)

    # Apply mask
    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    output.paste(image, (0, 0))
    output.putalpha(mask)

    return output


def main():
    print("\n=== App Store Preview Generator ===\n")

    # Ensure directories exist
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Check for screenshots
    existing = [p["input"] for p in PREVIEWS if (SCREENSHOTS_DIR / p["input"]).exists()]

    if not existing:
        print(f"No screenshots found in: {SCREENSHOTS_DIR}")
        print("\nPlease add your screenshots:")
        for p in PREVIEWS:
            print(f"  - {p['input']}: {p['title']}")
        print(f"\nThen run this script again.")
        sys.exit(1)

    print(f"Found {len(existing)} screenshot(s)")
    print(f"Output: {OUTPUT_DIR}\n")

    # Generate previews
    success = 0
    for config in PREVIEWS:
        if (SCREENSHOTS_DIR / config["input"]).exists():
            print(f"Generating: {config['title']}")
            if create_preview(config):
                success += 1

    print(f"\n✓ Generated {success} preview(s)")
    print(f"\nOutput directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
