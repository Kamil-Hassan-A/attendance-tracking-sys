from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from scalar_fastapi import get_scalar_api_reference


docs_router = APIRouter(prefix="/docs", tags=["Docs"])


@docs_router.get("", response_class=HTMLResponse)
async def docs_landing():
    return HTMLResponse(
        content="""
<!DOCTYPE html>
<html>
<head>
    <title>API Docs</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
        h1 { margin-bottom: 1.5rem; }
        .btn { 
            display: block; 
            margin: 0.5rem 0; 
            padding: 0.5rem 1rem; 
            background: #f0f0f0; 
            text-decoration: none; 
            color: #333; 
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>API Documentation</h1>
    <a class="btn" href="/docs/swagger">Swagger UI</a>
    <a class="btn" href="/docs/redoc">ReDoc</a>
    <a class="btn" href="/docs/scalar">Scalar</a>
    <a class="btn" href="/docs/rapidoc">RapiDoc</a>
    <a class="btn" href="/docs/explorer">OpenAPI Explorer</a>
    <a class="btn" href="/openapi.json">Raw OpenAPI JSON </a>
</body>
</html>
        """
    )


@docs_router.get("/scalar")
async def scalar_docs():
    return get_scalar_api_reference(
        openapi_url="/openapi.json",
    )


@docs_router.get("/rapidoc", response_class=HTMLResponse)
async def rapidoc_ui():
    return HTMLResponse(
        content="""
<!doctype html>
<html>
<head>
    <title>Student API - RapiDoc</title>
    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
</head>
<body>
    <rapi-doc spec-url="/openapi.json" theme="dark" show-header="false" />
</body>
</html>
"""
    )


@docs_router.get("/explorer")
async def open_explorer():
    return HTMLResponse(
        content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OpenAPI Explorer</title>
            <script src="https://unpkg.com/openapi-explorer"></script>
        </head>
        <body>
            <openapi-explorer spec-url="/openapi.json"></openapi-explorer>
        </body>
        </html>
        """
    )