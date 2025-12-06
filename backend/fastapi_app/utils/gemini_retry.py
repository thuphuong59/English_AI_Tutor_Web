import time
import logging
import functools
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, TooManyRequests

# Cấu hình logging cơ bản nếu chưa có
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def with_gemini_retry(max_retries=3, initial_delay=2, backoff_factor=2):
    """
    Decorator để tự động thử lại (retry) khi gọi Gemini API gặp lỗi Quota (429).
    Sử dụng chiến thuật Exponential Backoff (Chờ lâu dần: 2s -> 4s -> 8s).
    
    Cách dùng:
    @with_gemini_retry()
    def call_gemini_api():
        ...
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                
                except (ResourceExhausted, TooManyRequests, ServiceUnavailable) as e:
                    # Nếu là lần thử cuối cùng thì ném lỗi ra luôn
                    if attempt == max_retries:
                        logger.error(f"❌ Gemini API Failed after {max_retries} attempts. Error: {e}")
                        raise e
                    
                    # Log cảnh báo và chờ
                    logger.warning(f"⚠️ Gemini Quota Exceeded (429). Retrying in {delay}s... (Attempt {attempt}/{max_retries})")
                    time.sleep(delay)
                    
                    # Tăng thời gian chờ cho lần sau
                    delay *= backoff_factor
                
                except Exception as e:
                    # Các lỗi khác (Code lỗi, logic sai...) thì không retry
                    raise e
            return None
        return wrapper
    return decorator