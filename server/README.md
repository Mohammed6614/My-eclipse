Minimal backend for email verification (demo)

Quick start (PowerShell)

1. Open terminal in `c:\My_projects 2025\My_moon\server`
2. Install dependencies:

```powershell
npm install
```

3. Copy `.env.example` to `.env` and fill SMTP values for production. For local testing you can leave them empty — the server will create an Ethereal test account and print the preview URL.

4. Start server (dev):

```powershell
npm run dev
```

Server endpoints (base: http://localhost:3000/api)

- POST /api/register  { email, password }
- POST /api/send-verification  { email }
- POST /api/verify  { token }
- POST /api/login   { email, password }

Notes
- This is a minimal demo. Do NOT use plain base64 passwords in production. Replace with proper hashed passwords and a database.
- The server prints Ethereal preview URLs to the console so you can view the sent email during development.
