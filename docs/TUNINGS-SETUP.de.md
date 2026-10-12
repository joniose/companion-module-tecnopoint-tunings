# TuningS für Companion einrichten

Diese Anleitung beschreibt die Einstellungen in Tecnopoint TuningS, die das Companion-Modul benötigt. Die Bezeichnungen der Felder folgen dem englischen TuningS-Handbuch.

## 1. TCP/IP-Server einschalten

1. Öffne in TuningS das Fenster **Group Server Setup**.
2. Aktiviere **Enable TCP/IP Server**.
3. Wähle die IP-Adresse des TuningS-Computers, die vom Companion-Computer aus erreichbar ist.
4. Verwende den angezeigten TCP-Port auch in der Companion-Verbindung. Das Handbuch zeigt beispielhaft Port `22222`; übernimm die IP-Adresse aus der Abbildung nicht.

Im Companion-Modul trägst du dieselbe IP-Adresse und denselben Port ein. **Command terminator** sollte auf **CR + LF** stehen; das entspricht dem im Handbuch angegebenen CR/NL.

## 2. Statusantworten für Zellen einschalten

Im Fenster **Group Server Setup**:

1. Aktiviere **Enable Global Status reply**.
2. Trage als **Command** exakt `GET_STA` ein.
3. Speichere die Einstellungen.

`GET_STA` fordert den globalen Status aller Zellen an. Die automatische Umschaltung fragt mit `CSTAT [ZELLE]` gezielt eine Zelle ab; TuningS liefert dafür den Zellstatus im selben Statusformat. Die Antwort enthält zuerst den Befehlsnamen sowie Spalten- und Zeilenanzahl und danach die Statusziffern je Zelle.

Statuswerte laut Handbuch:

| Wert | Bedeutung |
| --- | --- |
| `0` | Für diese Zelle ist keine Sequenz gesetzt |
| `1` | Sequenz gestoppt |
| `2` | Sequenz läuft |
| `3` | Sequenz wird geschnitten |
| `4` | Sequenz gestoppt und bereit zum Start |

Die Toggle-Aktion startet die gewählte erste Zelle, wartet auf den Status **2** oder **3** und startet die andere Zelle, sobald der Status der laufenden Sequenz **1** oder **4** meldet.

> **Hinweis zu `HTTP/1.0 200 OK`:** Wenn **Enable Single Cell Reply** eingeschaltet ist, bestätigt TuningS einen gültigen `START [A1]`-Befehl mit dieser Antwort. Das ist eine Empfangsbestätigung, kein Zellstatus. Für die Statusauswertung ist die Antwort auf `CSTAT` maßgeblich.

## 3. Einzelzell-Bestätigung (optional)

**Enable Single Cell Reply** ist optional. Wenn du die Bestätigung für gültige Einzelzellbefehle aktivierst, setze das Feld **Reply** auf:

```text
HTTP/1.0 200 OK
```

TuningS beendet die Antwort mit einer Zeilenendung. Falls sie in deiner TuningS-Version fehlt, hänge `$$` an den Text an; laut Handbuch steht `$$` für Carriage Return / New Line. Diese Bestätigung ersetzt nicht die Statusantwort von `CSTAT`.

## 4. Globale Aktionen (optional)

Aktiviere nur die globalen Funktionen, die du im Companion-Modul verwenden willst. Trage in das jeweilige **Command**-Feld genau den Wert aus der Tabelle ein:

| TuningS-Option | Command |
| --- | --- |
| **Enable Global STOP** | `GLOBSTOP` |
| **Enable Global START** | `GLOBSTART` |
| **Enable Global CUT** | `GLOBCUT` |
| **Enable Global Status reply** | `GET_STA` |
| **Enable Global Group Select** | `SELECT##` |
| **Enable Global Pause** | `PAUSE` |
| **Enable Global Pause and Cut** | `PAUSECUT` |
| **Enable Global Resume from Pause** | `RESUME` |
| **Enable Global Emergency Stop** | `EM_STOP` |

Globale Start-, Stop- und Cut-Befehle wirken auf die in TuningS ausgewählte Gruppe. **Global Group Select** ermöglicht die Auswahl einer Gruppe mit `SELECT01` bis `SELECT10`.

## 5. Gruppenaktionen (optional)

Wenn du die Companion-Aktionen **Group: Start / Stop / Cut** verwenden willst, konfiguriere die Gruppenbefehle in TuningS unter **Group → Edit → Group 1…10**. Aktiviere für die gewünschte Gruppe **Enable TCP/IP Control** bei START, STOP und/oder CUT und verwende die passenden Befehle, zum Beispiel:

- `START GRP1`
- `STOP GRP1`
- `CUT GRP1`

Die Gruppen- und Gruppennummern müssen zu den in Companion gewählten Werten passen.

## 6. Companion-Zellbefehle

Einzelzellbefehle sind verfügbar, sobald der TCP/IP-Server eingeschaltet ist. Die Syntax verwendet die Zellkoordinate in eckigen Klammern:

- `START [A1]`
- `STOP [A1]`
- `CUT [A1]`
- `CSTAT [A1]`

Die Toggle-Aktion wechselt zwischen zwei konfigurierten Zellen, zum Beispiel `A1` und `B1`.

## Abbildungen im Handbuch

- [Group Server Setup und globale Befehle (PDF, Abbildung 121, S. 58)](TCP%20Commands.pdf#page=58)
- [Gruppenbefehle pro Gruppe (PDF, Abbildung 123, S. 59)](TCP%20Commands.pdf#page=59)
- [Syntax der Sequenzbefehle (PDF, ab S. 60)](TCP%20Commands.pdf#page=60)

Die IP-Adresse in den Abbildungen ist nur ein Beispiel. Verwende die IP-Adresse deines TuningS-Computers.