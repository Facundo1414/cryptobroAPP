@echo off
echo ================================
echo CryptoBro - Build Completo
echo ================================
echo.

echo [1/4] Limpiando archivos anteriores...
cd /d "%~dp0"
if exist "dist" rmdir /s /q dist
if exist "out" rmdir /s /q out

echo [2/4] Compilando backend...
cd ..\backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar backend
    pause
    exit /b 1
)

echo [3/4] Compilando frontend...
cd ..\desktop-app
call npm run build:export
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar frontend
    pause
    exit /b 1
)

echo [4/4] Generando instaladores...

echo - Generando instalador NSIS...
call npm run dist:win
if %errorlevel% neq 0 (
    echo WARNING: Fallo al generar instalador NSIS
)

echo - Generando version portable...
call npm run dist:portable
if %errorlevel% neq 0 (
    echo WARNING: Fallo al generar version portable
)

echo.
echo ================================
echo BUILD COMPLETADO
echo ================================
echo.
echo Archivos generados en dist/:

if exist "dist\CryptoBro-Setup-1.1.0.exe" (
    echo ✅ CryptoBro-Setup-1.1.0.exe [INSTALADOR]
) else (
    echo ❌ CryptoBro-Setup-1.1.0.exe [FALLO]
)

if exist "dist\CryptoBro-1.1.0-portable.exe" (
    echo ✅ CryptoBro-1.1.0-portable.exe [PORTABLE]
) else (
    echo ❌ CryptoBro-1.1.0-portable.exe [FALLO]
)

echo.
echo RECOMENDACION:
echo - Si antivirus detecta instalador: usar version portable
echo - Escanear ambos archivos en VirusTotal.com
echo - Ver ANTIVIRUS_WARNING.md para mas info
echo.

explorer dist

pause