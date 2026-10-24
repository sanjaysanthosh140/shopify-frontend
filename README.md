# shopify-frontend

React/Vite frontend for the Shopify Order Management CRM.

## Run locally

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

The dashboard runs at `http://localhost:5173` and calls the backend at `http://localhost:3000` by default. Set `VITE_API_URL` in `.env` when the backend uses another URL. Never commit `.env`.

## Build

```powershell
npm.cmd run build
```
