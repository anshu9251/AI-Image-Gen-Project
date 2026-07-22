import asyncio
import base64
import io
import logging
from urllib.parse import quote

import httpx
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

HF_TIMEOUT_SECONDS = 12


def _is_permanent_error(e: BaseException) -> bool:
    msg = str(e)
    return "402" in msg or "404" in msg


async def query_hf_model(prompt: str, model_id: str) -> bytes:
    """
    Generate an image using Hugging Face. Retries only on transient errors.
    """

    last_error = None

    for attempt in range(2):
        try:

            image: Image.Image = await asyncio.wait_for(
                asyncio.to_thread(
                    client.text_to_image,
                    prompt,
                    model=model_id,
                ),
                timeout=HF_TIMEOUT_SECONDS,
            )

            buffer = io.BytesIO()
            image.save(buffer, format="PNG")

            return buffer.getvalue()

        except asyncio.TimeoutError as e:

            logger.warning(f"Attempt {attempt+1}/2 for {model_id} timed out")
            last_error = e
            continue

        except BaseException as e:

            logger.warning(f"Attempt {attempt+1}/2 for {model_id} failed: {e}")
            last_error = e

            if _is_permanent_error(e):
                raise Exception(f"{model_id} permanent failure: {e}")

            await asyncio.sleep(1)

    raise Exception(f"{model_id} failed after retries: {last_error}")


async def query_cloudflare_model(prompt: str) -> bytes:
    """
    Primary: Generate an image using Cloudflare Workers AI (FLUX.1-schnell).
    """

    url = (
        f"https://api.cloudflare.com/client/v4/accounts/"
        f"{settings.cf_account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell"
    )
    headers = {"Authorization": f"Bearer {settings.cf_api_token}"}

    async with httpx.AsyncClient(timeout=30) as http_client:
        resp = await http_client.post(url, headers=headers, json={"prompt": prompt})

        if resp.status_code != 200:
            raise Exception(f"Cloudflare failed with status {resp.status_code}")

        data = resp.json()
        return base64.b64decode(data["result"]["image"])


async def query_pollinations_model(prompt: str) -> bytes:
    """
    Final fallback: Generate an image using Pollinations.ai (no API key needed).
    """

    url = f"https://image.pollinations.ai/prompt/{quote(prompt)}"

    async with httpx.AsyncClient(timeout=30) as http_client:
        resp = await http_client.get(url)

        if resp.status_code != 200:
            raise Exception(f"Pollinations failed with status {resp.status_code}")

        return resp.content


async def generate_image_from_prompt(prompt: str) -> str:

    last_error = None

    # 1️⃣ Try Cloudflare first — currently the fastest/most reliable provider
    try:

        logger.info("Trying Cloudflare Workers AI")

        image_bytes = await query_cloudflare_model(prompt)

        encoded = base64.b64encode(image_bytes).decode()

        return f"data:image/png;base64,{encoded}"

    except Exception as e:

        logger.error(f"Cloudflare failed: {e}")

        last_error = e

    # 2️⃣ Cloudflare failed — try Hugging Face models
    for model in MODELS:

        try:

            logger.info(f"Trying {model}")

            image_bytes = await query_hf_model(prompt, model)

            encoded = base64.b64encode(image_bytes).decode()

            return f"data:image/png;base64,{encoded}"

        except Exception as e:

            logger.error(e)

            last_error = e

    # 3️⃣ Everything failed — final fallback: Pollinations.ai
    try:

        logger.info("HF also failed, trying Pollinations.ai")

        image_bytes = await query_pollinations_model(prompt)

        encoded = base64.b64encode(image_bytes).decode()

        return f"data:image/png;base64,{encoded}"

    except Exception as e:

        logger.error(f"Pollinations failed: {e}")

        last_error = e

    raise Exception(f"All providers failed. Last error: {last_error}")