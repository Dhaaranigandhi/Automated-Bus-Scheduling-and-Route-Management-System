# Quality Assurance & Testing Manual

This document details the testing architecture, QA validation procedures, and performance validation standards.

---

## 🧪 Integration & Unit Testing (Jest + Supertest)

The test suite validates HTTP endpoints, data format validation schemas, and system status health checks.

### Running Tests
Execute the test suite locally using the following command inside the `backend/` directory:
```bash
cd backend
npm run test
```

### Key Test Coverages
1. **System Health Check (`GET /health`)**: Verifies that the Express API is online and the database connection is responsive.
2. **Authentication Boundary Checks (`POST /api/auth/login`)**: Validate response formatting for bad payloads and credential failures (returns `400 Bad Request`).

---

## 📈 Load and Performance Validation

For production environments, we recommend utilizing load testing tools like **Artillery** to verify WebSocket scale capacity.

### WebSocket Connections Scale Test Checklist
- **Telemetry Concurrency**: Simulates 100 simultaneous driver location streams pushing GPS coordinates to `/socket.io/` every 4 seconds.
- **Geofence Computations Scale**: Measures database lock durations and write latencies for `GPSLocation` records under high event throughput.
- **Target KPI**: Under a load of 1,000 concurrent WebSocket sessions, response latency must remain under **100ms** at the 95th percentile (p95).
