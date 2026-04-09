@echo off
cd /d C:\workspace\prioriza-api
docker compose up --build -d
cd /d C:\workspace\prioriza-frontend
npm run dev
pause
