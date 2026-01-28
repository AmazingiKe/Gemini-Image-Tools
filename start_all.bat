@echo off
:: Set character set to UTF-8
chcp 65001 > nul

title Gemini-Drafting-Factory Launcher
echo ==========================================
echo Starting Gemini-Drafting-Factory...
echo ==========================================

:: Start Backend
echo [1/2] Starting Backend (Rust Axum) in new window...
start "Gemini-Backend" cmd /c "cd backend && cargo run"

:: Wait for backend to initialize
timeout /t 5 /nobreak > nul

:: Start Frontend
echo [2/2] Starting Frontend (Vite React) in new window...
start "Gemini-Frontend" cmd /c "cd frontend && npm run dev"

echo ==========================================
echo All services started!
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:5173
echo ==========================================
pause
