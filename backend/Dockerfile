FROM python:3.11-slim

# Create user and group with UID 1000 for Hugging Face Space security
RUN useradd -m -u 1000 user

WORKDIR /code

# Copy requirements and install dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy application code
COPY ./app /code/app

# Set ownership of code directory to our user
RUN chown -R user:user /code

# Switch to non-root user
USER user

# Expose the default Hugging Face Spaces port
EXPOSE 7860

# Run the FastAPI server using uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}
