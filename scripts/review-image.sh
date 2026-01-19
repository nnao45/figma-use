#!/bin/bash
# Review an image using Gemini 2.5 Pro Preview via OpenRouter
# Usage: ./scripts/review-image.sh <image_path> [prompt]

IMAGE_PATH="$1"
PROMPT="${2:-Review this UI. Are there any alignment issues, spacing problems, or other visual defects? Give specific feedback.}"

if [ -z "$IMAGE_PATH" ]; then
  echo "Usage: $0 <image_path> [prompt]"
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "Error: File not found: $IMAGE_PATH"
  exit 1
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "Error: OPENROUTER_API_KEY not set"
  exit 1
fi

BASE64_IMAGE=$(base64 -i "$IMAGE_PATH")

curl -s "https://openrouter.ai/api/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "google/gemini-2.5-pro-preview",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "'"$PROMPT"'"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,'"$BASE64_IMAGE"'"
            }
          }
        ]
      }
    ]
  }' | jq -r '.choices[0].message.content'
