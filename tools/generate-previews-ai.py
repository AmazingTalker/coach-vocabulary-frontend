#!/usr/bin/env python3
"""
App Store Preview Image Generator (AI Version)

Uses Google Gemini AI to generate App Store preview images from app screenshots.

Usage: python tools/generate-previews-ai.py

Requirements:
    pip install google-genai Pillow

Before running:
1. Set your API key: export GOOGLE_API_KEY="your-api-key"
2. Place your screenshots in tools/screenshots/
3. Name them: 01.png, 02.png, 03.png, 04.png
4. Run the script

Get your API key from: https://aistudio.google.com/app/apikey
"""

import sys
import os
import base64
import traceback
from pathlib import Path
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai is required. Install with: pip install google-genai")
    sys.exit(1)


# === CONFIGURATION ===

# Paths
SCRIPT_DIR = Path(__file__).parent
SCREENSHOTS_DIR = SCRIPT_DIR / "screenshots"
OUTPUT_DIR = SCRIPT_DIR / "previews-ai"

# Output dimensions (iPhone 6.7")
OUTPUT_WIDTH = 1290
OUTPUT_HEIGHT = 2796

# Brand info
BRAND_COLOR = "#2db877"  # Mint green
APP_NAME = "Attain"

# Preview configurations - each with unique creative direction
PREVIEWS = [
    {
        "input": "01.png",
        "output": "preview_01_home.png",
        "title": "30 分鐘背 50 個單字",
        "subtitle": "高效學習，輕鬆記住",
        "creative_direction": """
This is the HERO image - first impression for the App Store.
Theme: Speed & Efficiency
Create an energetic, dynamic composition that conveys "fast learning".
Consider adding subtle motion elements, speed lines, or a sense of momentum.
The feeling should be: "Wow, I can learn this fast!"
Make it bold and eye-catching - this needs to stop people scrolling.
""",
    },
    {
        "input": "02.png",
        "output": "preview_02_learn.png",
        "title": "學習新單字",
        "subtitle": "圖片 + 發音 + 翻譯",
        "creative_direction": """
Theme: Multi-sensory Learning
This screen shows vocabulary with images, audio, and translations.
Create a warm, inviting composition that feels like discovery and understanding.
Consider visual elements that suggest sight (eye), sound (waves), and knowledge.
The feeling should be: "Learning is enjoyable and intuitive"
Use softer, more contemplative energy compared to the hero image.
""",
    },
    {
        "input": "03.png",
        "output": "preview_03_practice.png",
        "title": "閱讀練習",
        "subtitle": "看單字，選翻譯",
        "creative_direction": """
Theme: Challenge & Achievement
This is a quiz/practice screen with multiple choice options.
Create a composition that feels like a fun challenge or game.
Consider elements that suggest thinking, choosing, or puzzle-solving.
The feeling should be: "I can test myself and see my progress"
Add energy that suggests mental activity and the satisfaction of getting answers right.
""",
    },
    {
        "input": "04.png",
        "output": "preview_04_speaking.png",
        "title": "口說練習",
        "subtitle": "AI 語音辨識",
        "creative_direction": """
Theme: Voice & AI Technology
This screen shows speaking practice with AI voice recognition.
Create a futuristic, tech-forward composition that feels cutting-edge.
Consider visual elements like sound waves, voice visualization, or AI patterns.
The feeling should be: "This app uses smart technology to help me speak better"
Make it feel modern and innovative - showcase the AI aspect.
""",
    },
]


def load_image_as_base64(image_path: Path) -> str:
    """Load an image and convert to base64."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def ensure_exact_size(image: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """
    Ensure image is exactly the target size.
    If aspect ratio differs, crop/pad to fit while maintaining center.
    """
    current_width, current_height = image.size
    target_ratio = target_width / target_height
    current_ratio = current_width / current_height

    if current_ratio > target_ratio:
        # Image is wider - crop sides or pad top/bottom
        new_width = int(current_height * target_ratio)
        left = (current_width - new_width) // 2
        image = image.crop((left, 0, left + new_width, current_height))
    elif current_ratio < target_ratio:
        # Image is taller - crop top/bottom or pad sides
        new_height = int(current_width / target_ratio)
        top = (current_height - new_height) // 2
        image = image.crop((0, top, current_width, top + new_height))

    # Resize to exact dimensions
    image = image.resize((target_width, target_height), Image.Resampling.LANCZOS)

    print(f"    Final size: {image.size[0]}x{image.size[1]}")
    return image


def generate_preview_with_ai(config: dict, client, model_name: str) -> bool:
    """Generate a single preview image using Gemini AI."""
    input_path = SCREENSHOTS_DIR / config["input"]
    output_path = OUTPUT_DIR / config["output"]

    if not input_path.exists():
        print(f"  ✗ Input not found: {input_path}")
        return False

    try:
        # Load the screenshot
        screenshot = Image.open(input_path)

        # Create the prompt
        prompt = f"""Generate an image: App Store preview for "{APP_NAME}" - an English vocabulary learning app.

Take the provided app screenshot and create a complete marketing image around it.

MUST INCLUDE:
1. The app screenshot I'm providing - display it prominently with rounded corners (60-75% of composition)
2. Main headline: "{config['title']}" (Chinese text, large, white)
3. Subtitle: "{config['subtitle']}" (Chinese text, smaller, white)

STYLE:
- Primary color: {BRAND_COLOR} (mint green)
- Modern, clean, premium App Store aesthetic
- {OUTPUT_WIDTH}x{OUTPUT_HEIGHT} pixels (tall vertical iPhone format)

CREATIVE DIRECTION:
{config['creative_direction']}

Generate the image now."""

        print(f"  Generating with AI...")

        # Send to Gemini with the image using new SDK
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, screenshot],
            config=types.GenerateContentConfig(
                response_modalities=["Text", "Image"]
            )
        )

        # Check if we got an image back
        image_found = False
        if response.parts:
            for part in response.parts:
                # Check for inline_data (image)
                if hasattr(part, 'inline_data') and part.inline_data is not None:
                    mime_type = getattr(part.inline_data, 'mime_type', 'unknown')
                    print(f"    Found image data (mime: {mime_type})")

                    # Get image data and convert to PIL Image
                    image_data = part.inline_data.data
                    if isinstance(image_data, str):
                        image_data = base64.b64decode(image_data)
                    image = Image.open(BytesIO(image_data))

                    # Always resize to exact dimensions
                    image = ensure_exact_size(image, OUTPUT_WIDTH, OUTPUT_HEIGHT)

                    # Save
                    image.save(output_path, "PNG", quality=95)

                    size_kb = output_path.stat().st_size / 1024
                    print(f"  ✓ {config['output']} ({size_kb:.0f} KB)")
                    image_found = True
                    return True

        if not image_found:
            # Log what we got instead
            print(f"  ✗ No image in response. Parts received:")
            for i, part in enumerate(response.parts if response.parts else []):
                part_type = type(part).__name__
                if hasattr(part, 'text') and part.text:
                    preview = part.text[:80].replace('\n', ' ')
                    print(f"    Part {i}: {part_type} - text: \"{preview}...\"")
                elif hasattr(part, 'inline_data'):
                    mime = getattr(part.inline_data, 'mime_type', 'unknown') if part.inline_data else 'none'
                    print(f"    Part {i}: {part_type} - inline_data (mime: {mime})")
                else:
                    print(f"    Part {i}: {part_type}")

            if not response.parts:
                print("    (no parts in response)")

        return False

    except Exception as e:
        print(f"  ✗ Error: {type(e).__name__}: {e}")
        traceback.print_exc()
        return False


def main():
    print("\n=== App Store Preview Generator (AI Version) ===\n")

    # Check for API key
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable not set")
        print("\nTo set it:")
        print('  export GOOGLE_API_KEY="your-api-key"')
        print("\nGet your API key from: https://aistudio.google.com/app/apikey")
        sys.exit(1)

    # Initialize client
    client = genai.Client(api_key=api_key)

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

    # Try image generation models in order of preference
    models_to_try = [
        "gemini-3-pro-image-preview",
        "gemini-2.5-flash-image",
    ]

    model_name = None
    for test_model in models_to_try:
        try:
            print(f"Trying model: {test_model}...")
            # Quick test to check if model is available
            test_response = client.models.generate_content(
                model=test_model,
                contents="Say hello",
                config=types.GenerateContentConfig(
                    response_modalities=["Text"]
                )
            )
            model_name = test_model
            print(f"Using {model_name}\n")
            break
        except Exception as e:
            error_msg = str(e)[:100]
            print(f"  Not available: {error_msg}")
            continue

    if not model_name:
        print("\nNo image generation model available.")
        print("Please check your API key has access to image generation models.")
        sys.exit(1)

    # Generate previews
    success = 0
    failed = []
    for config in PREVIEWS:
        if (SCREENSHOTS_DIR / config["input"]).exists():
            print(f"Generating: {config['title']}")

            if generate_preview_with_ai(config, client, model_name):
                success += 1
            else:
                failed.append(config["input"])

    print(f"\n{'✓' if success > 0 else '✗'} Generated {success} preview(s)")

    if failed:
        print(f"✗ Failed: {', '.join(failed)}")

    if success > 0:
        print(f"\nOutput directory: {OUTPUT_DIR}")
    else:
        print("\nNote: AI image generation may have limitations.")
        print("Consider using the non-AI version: ./tools/generate-previews.py")


if __name__ == "__main__":
    main()
