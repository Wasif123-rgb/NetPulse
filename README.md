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
<img width="1907" height="915" alt="Screenshot 2026-11-22 172638" src="https://github.com/user-attachments/assets/54fece54-b933-42ff-bdc6-4b7e3e4f3ded" />
<img width="1557" height="378" alt="Screenshot 2026-11-22 172652" src="https://github.com/user-attachments/assets/08895df6-ca83-485d-81fd-0cdc601040b5" />
<img width="1542" height="431" alt="Screenshot 2026-11-22 172706" src="https://github.com/user-attachments/assets/f52010c1-5f0e-4595-a212-3f33297e29f5" />
<img width="1547" height="832" alt="Screenshot 2026-11-22 172719" src="https://github.com/user-attachments/assets/11824932-1415-4b93-800f-05e9421c43c8" />
<img width="1547" height="850" alt="Screenshot 2026-11-22 172741" src="https://github.com/user-attachments/assets/9036d18b-f4e9-4427-a0d4-8713d050457d" />
<img width="1582" height="857" alt="Screenshot 2026-11-22 172804" src="https://github.com/user-attachments/assets/14b417b3-f9e3-4d2c-bdc2-f876ed531968" />
<img width="1557" height="893" alt="Screenshot 2026-11-22 172825" src="https://github.com/user-attachments/assets/f96c01bf-534b-4c88-b7cd-700d9ee2960c" />
<img width="1547" height="726" alt="Screenshot 2026-11-22 172844" src="https://github.com/user-attachments/assets/659a88fa-8251-42c4-a3f8-9053ae48fa03" />
<img width="1488" height="867" alt="Screenshot 2026-11-22 172922" src="https://github.com/user-attachments/assets/5c610f38-dfeb-4ba5-8d38-342a9de9450e" />
<img width="1506" height="575" alt="Screenshot 2026-11-22 172945" src="https://github.com/user-attachments/assets/8dcb60fa-d496-44d9-91bc-c877f1db56af" />




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
