╔══════════════════════════════════════════════════════════════╗
║          CONVERT ANYTHING — OFFLINE BUILD                    ║
║          No internet required after this point!              ║
╚══════════════════════════════════════════════════════════════╝

REQUIREMENTS
============
Node.js must be installed on your computer.

  Download → https://nodejs.org
  Choose:     "LTS — Recommended For Most Users"
  Install:    Click Next / Next / Finish like any normal app.

That's the only thing you need to install. Node.js is free.


STARTING THE APP
================

  Windows
  -------
  Double-click:  start.bat
  Your browser will open automatically.

  Mac
  ---
  Right-click launch.sh → Open With → Terminal
  (Or open Terminal and type: bash /path/to/launch.sh)
  Your browser will open automatically.

  Linux
  -----
  Open a terminal in this folder and run:
    bash launch.sh

  Manual (any platform)
  ---------------------
  Open a terminal in this folder and run:
    node serve.js
  Then open your browser to:  http://localhost:8080/


CHANGING THE PORT
=================
If port 8080 is already in use, you can use a different one:

  Mac / Linux:
    PORT=9000 node serve.js

  Windows:
    set PORT=9000 && node serve.js


STOPPING THE SERVER
===================
Press Ctrl+C in the terminal / command prompt window.


YOUR FILES ARE PRIVATE
======================
Everything runs on YOUR computer.
Your files are NEVER uploaded anywhere.
No internet connection is needed after the app starts.


UPDATING
========
Download the latest release ZIP from:
  https://github.com/leothefleo49/convert/releases

Unzip it and replace the old folder. Settings are not saved
between versions (browser localStorage may be preserved).


TROUBLESHOOTING
===============
Q: My browser opened but shows an error / blank page.
A: Wait 5 seconds and refresh. The first load builds an
   internal format list which takes a moment.

Q: "Port 8080 is already in use"
A: Change the port (see CHANGING THE PORT above).

Q: FFmpeg / audio conversions seem slower than online.
A: Without the COOP/COEP headers the browser can't use
   multithreaded WASM. serve.js sets these automatically
   once you access the app through it — don't open the
   HTML file directly from Explorer/Finder.
