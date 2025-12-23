"""
Caching utilities for performance optimization.
"""
from functools import wraps
from typing import Callable, Any, Optional
from datetime import timedelta
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

# Simple in-memory cache (for development)
# In production, use Redis or similar
_cache: dict[str, tuple[Any, float]] = {}


def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_data = {
        'args': str(args),
        'kwargs': sorted(kwargs.items()),
    }
    key_string = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached(ttl_seconds: int = 300):
    """
    Decorator to cache function results.
    
    Args:
        ttl_seconds: Time to live in seconds (default: 5 minutes)
    
    Usage:
        @cached(ttl_seconds=60)
        def expensive_function(arg1, arg2):
            return expensive_computation()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip caching in test mode
            if hasattr(wrapper, '_skip_cache'):
                return func(*args, **kwargs)
            
            # Generate cache key
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Check cache
            if key in _cache:
                result, expiry = _cache[key]
                from time import time
                if time() < expiry:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return result
                else:
                    # Expired, remove from cache
                    del _cache[key]
            
            # Cache miss, call function
            result = func(*args, **kwargs)
            
            # Store in cache
            from time import time
            _cache[key] = (result, time() + ttl_seconds)
            logger.debug(f"Cached result for {func.__name__}")
            
            return result
        
        # Allow disabling cache for testing
        wrapper._skip_cache = False
        return wrapper
    return decorator


def clear_cache(pattern: Optional[str] = None):
    """
    Clear cache entries.
    
    Args:
        pattern: Optional pattern to match cache keys (e.g., 'get_listings:*')
    """
    global _cache
    if pattern:
        keys_to_remove = [k for k in _cache.keys() if pattern in k]
        for key in keys_to_remove:
            del _cache[key]
        logger.info(f"Cleared {len(keys_to_remove)} cache entries matching '{pattern}'")
    else:
        _cache.clear()
        logger.info("Cleared all cache entries")


def get_cache_stats() -> dict:
    """Get cache statistics"""
    from time import time
    current_time = time()
    active_entries = sum(1 for _, expiry in _cache.values() if expiry > current_time)
    expired_entries = len(_cache) - active_entries
    
    return {
        'total_entries': len(_cache),
        'active_entries': active_entries,
        'expired_entries': expired_entries,
    }

