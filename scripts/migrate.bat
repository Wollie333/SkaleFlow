@echo off
REM Migration script for Windows
REM This will run when you have psql installed or when network is fixed

echo Running Supabase migrations...
echo.

set "SUPABASE_ACCESS_TOKEN=sbp_43bd1480393a60886095d236dca10a549fab7be1"
set "DB_PASSWORD=Tanglewood3#13795"

npx supabase db push --password "%DB_PASSWORD%"

echo.
echo Migration complete!
pause
