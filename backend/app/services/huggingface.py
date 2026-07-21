import asyncio
import base64
import io
import logging

from huggingface_hub import InferenceClient
from PIL import Image

from app.config import settings

logger = logging.getLogger("uvicorn.error")

client = InferenceClient(api_key=settings.hf_api_key)

MODELS = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "Lykon/dreamshaper-8",
]


async def query_hf_model(prompt: str, model_id: str) -> bytes:
    """
    Generate an image using Hugging Face.
    """

    for attempt in range(3):
        try:

            image: Image.Image = await asyncio.to_thread(
                client.text_to_image,
                prompt,
                model=model_id,
            )

            buffer = io.BytesIO()
            image.save(buffer, format="PNG")

            return buffer.getvalue()

        except Exception as e:

            logger.warning(
                f"Attempt {attempt+1}/3 failed: {e}"
            )

            if attempt == 2:
                raise

            await asyncio.sleep(2)


async def generate_image_from_prompt(prompt: str) -> str:

    last_error = None

    for model in MODELS:

        try:

            logger.info(f"Trying {model}")

            image_bytes = await query_hf_model(prompt, model)

            encoded = base64.b64encode(image_bytes).decode()

            return f"data:image/png;base64,{encoded}"

        except Exception as e:

            logger.error(e)

            last_error = e

    raise Exception(f"All models failed: {last_error}")