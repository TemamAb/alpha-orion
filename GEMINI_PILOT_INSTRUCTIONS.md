# 🤖 GEMINI AI ASSIST: ALPHA-ORION AUTONOMOUS PILOT PROTOCOL

**ROLE**: Autonomous DevOps & Strategy Engineer  
**OBJECTIVE**: Achieve consistent **Profit Generation Phase** through continuous monitoring, diagnosis, and code remediation.

---

## 🔄 CONTINUOUS IMPROVEMENT LOOP

Execute the following cycle until the **Profit Generation Criteria** are met.

### 1. 🚀 DEPLOY & EXECUTE
*   **Command**: Run `continuous_pilot.bat`
*   **Action**: This script starts the User API, Dashboard, and AI Optimizer locally.
*   **Goal**: Ensure all services start without `ECONNREFUSED` or syntax errors.

### 2. 👁️ MONITOR TELEMETRY
*   **Source**: Watch `pilot_logs_api.txt` (User API) and `pilot_logs_dashboard.txt` (Dashboard).
*   **Dashboard**: Check `http://localhost:9090` (or detected port).
*   **Key Metrics**:
    *   `[PROFIT]`: Realized gains.
    *   `[OPPORTUNITY]`: Arbitrage paths found.
    *   `[ERROR]`: Stack traces or API failures.

### 3. 🧠 DIAGNOSE & FIX
**IF** `[ERROR]` detected:
1.  **Analyze**: Read the stack trace in `pilot_logs_api.txt` or `pilot_logs_dashboard.txt`.
2.  **Fix**: Modify the offending file (e.g., `multi_chain_engine.py`, `.env`).
3.  **Commit**: Run `push_repo.bat` to save the fix.
4.  **Restart**: Terminate and re-run `continuous_pilot.bat`.

**IF** `No Opportunities` (Starvation):
1.  **Analyze**: Check `MIN_PROFIT_THRESHOLD` in `.env`.
2.  **Tune**: Lower threshold or enable more DEXs in `config.py`.
3.  **Commit**: Run `push_repo.bat`.
4.  **Restart**: Re-run `continuous_pilot.bat`.

### 4. 💰 PROFIT GENERATION CRITERIA (SUCCESS)
The system is considered "Stable" when:
*   ✅ No critical errors for 60 minutes.
*   ✅ At least 3 profitable trades executed.
*   ✅ Net P&L > $0.00 (after gas).

---

## 🛠️ TOOLKIT

### `continuous_pilot.bat`
*   **Usage**: `continuous_pilot.bat`
*   **Function**: Clears logs, starts API (Port 8080), starts Dashboard (Auto-Port), and streams output to `pilot_logs.txt`.

### `push_repo.bat`
*   **Usage**: `push_repo.bat`
*   **Function**: Auto-commits all changes with a timestamp and pushes to GitHub. Use this after **EVERY** fix.

### `pilot_logs_*.txt`
*   **Usage**: `type pilot_logs_api.txt`
*   **Function**: Split log files to avoid Windows file locking issues.

---

## 📝 INSTRUCTION TO GEMINI

> "Gemini, please analyze `pilot_logs_api.txt` and `pilot_logs_dashboard.txt`. If there are errors, propose code fixes. If the system is running but not profitable, suggest parameter adjustments. Once fixes are applied, instruct me to run `push_repo.bat` and then restart `continuous_pilot.bat`."