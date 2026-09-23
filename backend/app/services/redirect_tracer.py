"""Asynchronous Sandbox Redirect Tracer for analyzing URL hops and unshortening links safely."""

import time
import asyncio
from urllib.parse import urlparse, urljoin
from typing import List, Dict, Any, Set
import httpx
from app.core.config import HTTP_TIMEOUT_SECONDS, MAX_REDIRECT_HOPS, KNOWN_SHORTENERS

SAFE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 QRShield-Sandbox/1.0"


async def trace_redirect_chain(start_url: str) -> Dict[str, Any]:
    """
    Safely trace HTTP redirects step-by-step in an async sandbox.
    Unshortens bit.ly/tinyurl chains and records every intermediate gateway.
    """
    if not start_url.startswith(("http://", "https://")):
        start_url = "https://" + start_url

    hops: List[Dict[str, Any]] = []
    visited_urls: Set[str] = set()
    current_url = start_url
    hop_index = 1
    has_cross_domain = False
    is_shortened_origin = False
    is_unreachable = False
    error_reason = None

    # Check if initial domain is a known shortener
    try:
        initial_host = urlparse(start_url).hostname or ""
        if initial_host.lower() in KNOWN_SHORTENERS:
            is_shortened_origin = True
    except Exception:
        initial_host = ""

    # Configure secure sandbox client (no automatic follow_redirects so we capture each hop explicitly)
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(HTTP_TIMEOUT_SECONDS, connect=HTTP_TIMEOUT_SECONDS),
        follow_redirects=False,
        verify=False, # We inspect untrusted certs in sandbox without failing prematurely
        limits=limits,
        headers={"User-Agent": SAFE_USER_AGENT}
    ) as client:
        while hop_index <= MAX_REDIRECT_HOPS:
            if current_url in visited_urls:
                hops.append({
                    "hop": hop_index,
                    "url": current_url,
                    "domain": urlparse(current_url).hostname or "",
                    "status_code": 508,
                    "latency_ms": 0,
                    "note": "Redirect loop detected"
                })
                break

            visited_urls.add(current_url)
            parsed_current = urlparse(current_url)
            current_host = parsed_current.hostname or ""

            if current_host.lower() in KNOWN_SHORTENERS:
                is_shortened_origin = True

            t0 = time.perf_counter()
            try:
                # HEAD request first for speed, fall back to GET if 405 Method Not Allowed
                try:
                    response = await client.head(current_url)
                    if response.status_code in [405, 501]:
                        response = await client.get(current_url)
                except httpx.RequestError:
                    response = await client.get(current_url)

                elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
                status = response.status_code
                location_header = response.headers.get("location")

                hop_record = {
                    "hop": hop_index,
                    "url": current_url,
                    "domain": current_host,
                    "status_code": status,
                    "latency_ms": elapsed_ms,
                    "content_type": response.headers.get("content-type", "").split(";")[0],
                    "server": response.headers.get("server", ""),
                }
                hops.append(hop_record)

                # Check if it's a redirect status code
                if status in [301, 302, 303, 307, 308] and location_header:
                    next_url = urljoin(current_url, location_header)
                    next_host = urlparse(next_url).hostname or ""
                    if next_host and next_host.lower() != current_host.lower():
                        has_cross_domain = True
                    current_url = next_url
                    hop_index += 1
                else:
                    # Final landing destination reached
                    break

            except httpx.ConnectTimeout:
                elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
                is_unreachable = True
                error_reason = "Connection timed out (Host did not respond)"
                hops.append({
                    "hop": hop_index,
                    "url": current_url,
                    "domain": current_host,
                    "status_code": 504,
                    "latency_ms": elapsed_ms,
                    "note": "Connection timed out"
                })
                break

            except httpx.ConnectError:
                elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
                is_unreachable = True
                error_reason = "Domain does not exist or refused connection (NXDOMAIN / Connection refused)"
                hops.append({
                    "hop": hop_index,
                    "url": current_url,
                    "domain": current_host,
                    "status_code": 502,
                    "latency_ms": elapsed_ms,
                    "note": "DNS resolution failed or host down"
                })
                break

            except Exception as ex:
                elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
                is_unreachable = True
                error_reason = f"Sandbox probe exception: {str(ex)}"
                hops.append({
                    "hop": hop_index,
                    "url": current_url,
                    "domain": current_host,
                    "status_code": 500,
                    "latency_ms": elapsed_ms,
                    "note": error_reason
                })
                break

    final_url = current_url
    final_domain = urlparse(final_url).hostname or ""

    return {
        "start_url": start_url,
        "final_url": final_url,
        "final_domain": final_domain,
        "total_hops": len(hops),
        "is_shortened": is_shortened_origin,
        "has_cross_domain_hop": has_cross_domain,
        "is_unreachable": is_unreachable,
        "error_reason": error_reason,
        "hops": hops
    }
