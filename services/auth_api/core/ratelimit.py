
import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status
from .config import settings

WINDOW = 60  # seconds
buckets: dict[str, deque[float]] = defaultdict(deque)

async def rate_limit(request: Request):
    # trust client IP from scope (dev only)
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    dq = buckets[ip]
    while dq and now - dq[0] > WINDOW:
        dq.popleft()
    dq.append(now)
    if len(dq) > settings.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
