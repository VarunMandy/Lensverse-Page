"""
Local dev server for Lensverse.

Behaves like the production hosts: unknown paths fall through to index.html so
/portfolio, /about and /contact work as real links, and the modern image types
are served with correct MIME types (Python's stdlib map has no AVIF entry).

    python tools/serve.py            # http://localhost:8124
    python tools/serve.py --port 9000
"""

from __future__ import annotations

import argparse
import functools
import mimetypes
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTES = {"", "portfolio", "about", "contact"}

mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("image/svg+xml", ".svg")


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        path = self.path.split("?", 1)[0].split("#", 1)[0].strip("/")
        # A client-side route (no file extension, known name) -> serve the shell.
        if path in ROUTES and not Path(path).suffix:
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        if self.path.startswith("/media/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8124)
    args = ap.parse_args()

    os.chdir(ROOT)
    handler = functools.partial(Handler, directory=str(ROOT))
    server = HTTPServer(("127.0.0.1", args.port), handler)
    print(f"Lensverse dev server -> http://localhost:{args.port}")
    print("client-side routes: /portfolio  /about  /contact")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
