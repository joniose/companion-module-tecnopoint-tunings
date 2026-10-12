# Companion module: Tecnopoint TuningS

Control a Tecnopoint Tuning Ceiling Dolly through the TuningS software TCP/IP server.

## Setup

1. Configure TuningS as described in the [German TuningS setup guide](docs/TUNINGS-SETUP.de.md), including the TCP/IP server, status reply, and any global or group commands you plan to use.
2. In Companion, enter the TuningS computer's reachable IP address and the same TCP port (the manual's example uses `22222`).
3. Keep **Command terminator** at **CR + LF** unless your TuningS setup requires a different terminator.

The guide links to the relevant figures in the [TuningS TCP command manual](docs/TCP%20Commands.pdf#page=58).

## Actions

- **Sequence: Start / Stop / Cut / Status** sends `START [A1]`, `STOP [A1]`, `CUT [A1]` or `CSTAT [A1]` for a cell coordinate.
- **Group: Start / Stop / Cut** sends commands such as `CUT GRP3` for groups 1-10.
- **Global command** sends `GLOBSTART`, `GLOBSTOP`, `PAUSE`, `PAUSECUT`, `RESUME`, `EM_STOP`, `GET_STA`, or selects a group with `SELECT01` through `SELECT10`.
- **Send custom TCP command** allows other commands documented/configured by TuningS, including group commands such as `CUT GRP3`.
- **Toggle automatic cell alternation** starts/stops automatic switching between two sequence cells. When enabled it starts the selected first cell, polls its status with `CSTAT`, and starts the other cell after it has reported running/cutting and then status 4. The polling interval is configurable from 500 to 10000 ms.

The module reconnects automatically after a connection loss. Responses are logged and exposed as variables. TuningS must have the relevant TCP/IP command and reply options enabled. Turning the alternation mode off stops further automatic switching; it does not stop a sequence already running in TuningS.

## Variables and feedback

- `Last TCP response` contains the most recent complete server response line.
- `Last cell queried` and `Last cell status (0-4)` update when a `CSTAT` response is received in the documented `CSTAT [cell] [status]` form.
- **Cell has status** matches the last reported cell and status. TuningS status values are 0 (no sequence), 1 (stopped), 2 (executing), 3 (cutting), and 4 (stopped and ready).

Presets provide sequence controls for cell A1 and the global commands. Duplicate or edit them to target other cells.

The **Automation** preset toggles alternation between A1 and B1. For other cells, add the **Toggle automatic cell alternation** action and set the two cell coordinates, first cell, and poll interval.
