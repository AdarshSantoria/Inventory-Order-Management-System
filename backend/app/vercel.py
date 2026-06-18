from collections.abc import Awaitable, Callable

from app.main import app as fastapi_app


class VercelPrefixAdapter:
    def __init__(self, app, prefix: str = "/api") -> None:
        self.app = app
        self.prefix = prefix

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] in {"http", "websocket"}:
            path = scope.get("path", "")
            root_path = scope.get("root_path", "")

            if path == self.prefix or path.startswith(f"{self.prefix}/"):
                scope = dict(scope)
                scope["root_path"] = f"{root_path}{self.prefix}"
                trimmed = path[len(self.prefix) :]
                scope["path"] = trimmed or "/"

        await self.app(scope, receive, send)


app = VercelPrefixAdapter(fastapi_app)
