# NetPulse — Internet Quality Monitor

A React + TypeScript dashboard starter for an Internet Quality Monitor. The dashboard currently uses simulated metrics; real network checks and a backend are planned next.


## Run locally

1. Install Node.js (LTS) if it is not installed.
2. Extract this ZIP and open the `internet-quality-monitor` folder in VS Code.
3. Open VS Code Terminal in the project folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```
5. Open the localhost URL Vite prints (usually `http://localhost:5173`).

## Current features
- Responsive dark dashboard
- Simulated latency updates every 4 seconds while monitoring is active
- Pause/resume button
- Latency graph
- Metric cards and server/activity panels


## Planned next steps
- Real browser-based endpoint measurements
- Laravel API and database storage for monitoring history
- Actual packet loss and uptime calculation

