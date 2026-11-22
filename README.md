# NetPulse — Internet Quality Monitor

NetPulse is a web-based internet quality monitoring application built with React and TypeScript. It helps users monitor internet performance, run speed tests, analyze connection stability, and review historical network data through an interactive dashboard.

## Features

- **Live Network Monitoring** — Monitor internet connectivity and response time.
- **Speed Testing** — Measure download and upload speeds.
- **Latency Monitoring** — Track current and average response times.
- **Jitter Monitoring** — Analyze variation in response time.
- **Network Quality Score** — Calculate an overall network performance score.
- **Network Alerts** — Receive alerts when connection conditions change.
- **Test History** — Review previously saved network test results.
- **Network Information** — View browser-accessible connection information.
- **Diagnostics** — Run connectivity and performance checks.
- **Reports & Export** — Generate reports and export test history to CSV.
- **Performance Trends** — Visualize latency, speed, jitter, and quality score over time.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type safety |
| Vite | Development and build tool |
| Recharts | Performance charts |
| Lucide React | Icons |
| CSS | Styling |
| Browser Local Storage | Local history and settings |

## Getting Started

### 1. Clone the repository

git clone https://github.com/wasif123-rgb/NetPulse.git

### 2. Open the project folder

cd internet-quality-monitor

### 3. Install dependencies

npm install

### 4. Start the development server

npm run dev

Open the local URL shown in your terminal.

## Production Build

To create a production build:

npm run build

To preview the production build locally:

npm run preview

## Project Structure

internet-quality-monitor/
├── public/
├── src/
│   ├── components/
│   │   ├── MetricCard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── NetworkAlerts.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── History.tsx
│   │   ├── Network.tsx
│   │   ├── Diagnostics.tsx
│   │   └── Reports.tsx
│   ├── utils/
│   │   └── networkTest.ts
│   └── App.tsx
├── package.json
└── README.md

## Screenshots




## Notes and Limitations

- Test history and alert settings are stored locally in the browser.
- Browser-based network measurements can be affected by browser restrictions, network conditions, and external test endpoints.
- The failed-request rate represents application HTTP probe failures; it is not a direct ICMP packet-loss measurement.
- Some network information, such as router details and Wi-Fi signal strength, is not exposed by standard browser APIs.

## Future Improvements

Possible future enhancements include more advanced diagnostic tools, configurable monitoring intervals, and additional report filtering.

## Author

Developed as a Computer Science and Engineering semester project.

**Project:** NetPulse — Internet Quality Monitor
