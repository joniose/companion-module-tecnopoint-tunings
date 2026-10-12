# Tecnopoint TuningS

This module connects to the TCP/IP server in the Tecnopoint TuningS software to control sequences and groups for a Tuning Ceiling Dolly.

## Connection and TuningS setup

In TuningS, enable the TCP/IP server in **Group Server Setup** and configure **Global Status reply** as `GET_STA`. This is needed for the status replies used by the cell status action and automatic alternation. Enable any other global or group commands that you plan to use.

Then enter the TuningS computer's reachable IP address and the same TCP port here. The manual's example uses `22222`. Keep **Command terminator** at **CR + LF** unless TuningS is configured differently.

See the [step-by-step TuningS setup guide](../docs/TUNINGS-SETUP.de.md) and the [manual figure for Group Server Setup (PDF, p. 58)](../docs/TCP%20Commands.pdf#page=58).

## Commands

Sequence commands use cell coordinates, for example `START [A1]`, `STOP [A1]`, `CUT [A1]` and `CSTAT [A1]`. Group actions send `START GRP1`, `STOP GRP1` or `CUT GRP1`. Global commands include `SELECT02`, `GLOBSTART`, `GLOBSTOP`, `PAUSE`, `PAUSECUT`, `RESUME`, `EM_STOP` and `GET_STA`.

TuningS must have the corresponding command and status-reply options enabled. TCP responses appear in the module log and in the `Last TCP response` variable. `CSTAT` updates `Last cell queried` and `Last cell status` when a single-cell status is returned.

## Automatic alternation

The **Toggle automatic cell alternation** action switches between two sequence cells. Enabling it starts the selected first cell and periodically sends `CSTAT` for that cell. After the module observes status 2 (executing) or 3 (cutting), it waits for status 4 (stopped and ready), then starts the other cell. The poll interval can be set from 500 to 10000 ms. The built-in Automation preset toggles A1 and B1; use the action directly for other cell coordinates. Turning the mode off prevents further automatic switching but does not stop the currently running sequence.
