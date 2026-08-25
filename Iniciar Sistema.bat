@echo off
title America Anatomy - Iniciando...
echo Iniciando o sistema America Anatomy...
echo.

cd /d "%~dp0backend"
start "America Anatomy - Backend" cmd /k "npm run dev"

cd /d "%~dp0frontend"
start "America Anatomy - Frontend" cmd /k "npm run dev"

echo Aguardando os servidores subirem...
timeout /t 8 /nobreak >nul

start "" "http://localhost:8080"

echo.
echo Pronto! O sistema deve abrir no seu navegador.
echo Se nao abrir, acesse manualmente: http://localhost:8080
echo.
echo Duas janelas pretas vao ficar abertas (backend e frontend) - NAO FECHE ELAS, sao o sistema rodando.
echo Para desligar o sistema, so fechar as duas janelas pretas.
pause
