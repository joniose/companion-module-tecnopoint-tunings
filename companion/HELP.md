# Tecnopoint TuningS

This module connects to the TCP/IP server in the Tecnopoint TuningS software to control sequences and groups for a Tuning Ceiling Dolly.

## Connection

Enable the TCP/IP server in TuningS under **Group Server Setup**, then enter the computer's IP address and configured TCP port here. The command manual's example uses port `22222`. Select the terminator expected by that server; CR/LF is the default.

## Commands

Sequence commands use cell coordinates, for example `START [A1]`, `STOP [A1]`, `CUT [A1]` and `CSTAT [A1]`. Group actions send `START GRP1`, `STOP GRP1` or `CUT GRP1`. Global commands include `SELECT02`, `GLOBSTART`, `GLOBSTOP`, `PAUSE`, `PAUSECUT`, `RESUME`, `EM_STOP` and `GET_STA`.

TuningS must have the corresponding command and status-reply options enabled. TCP responses appear in the module log and in the `Last TCP response` variable. `CSTAT` updates `Last cell queried` and `Last cell status` when a single-cell status is returned.

## Automatic alternation

The **Toggle automatic cell alternation** action switches between two sequence cells. Enabling it starts the selected first cell and periodically sends `CSTAT` for that cell. After the module observes status 2 (executing) or 3 (cutting), it waits for status 4 (stopped and ready), then starts the other cell. The poll interval can be set from 500 to 10000 ms. The built-in Automation preset toggles A1 and B1; use the action directly for other cell coordinates. Turning the mode off prevents further automatic switching but does not stop the currently running sequence.
