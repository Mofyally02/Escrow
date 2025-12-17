"""
Performance optimization utilities.
"""
from functools import wraps
from time import time
from typing import Callable, Any
from app.utils.observability import log_performance_metric


def measure_performance(operation_name: str):
    """
    Decorator to measure and log function execution time.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time()
            try:
                result = await func(*args, **kwargs)
                duration_ms = (time() - start_time) * 1000
                log_performance_metric(operation_name, duration_ms, success=True)
                return result
            except Exception as e:
                duration_ms = (time() - start_time) * 1000
                log_performance_metric(operation_name, duration_ms, success=False, metadata={"error": str(e)})
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time()
            try:
                result = func(*args, **kwargs)
                duration_ms = (time() - start_time) * 1000
                log_performance_metric(operation_name, duration_ms, success=True)
                return result
            except Exception as e:
                duration_ms = (time() - start_time) * 1000
                log_performance_metric(operation_name, duration_ms, success=False, metadata={"error": str(e)})
                raise
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator

