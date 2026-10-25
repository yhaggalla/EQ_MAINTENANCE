@echo off
rem Double-click to start the local EQ & FAC Maintenance demo. Arguments pass through, e.g. start-demo.cmd -Mode 3D
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-demo.ps1" %*
