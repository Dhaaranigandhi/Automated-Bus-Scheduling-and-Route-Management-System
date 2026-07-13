# Smart Bus Scheduling and Route Management System

A production-ready, enterprise-grade web application to digitize bus scheduling, transit routing, and fleet operations. Built with a responsive **Professional Royal Blue** theme, a stateless REST API backend, and a relational MySQL storage tier.

---

## 🌟 Key Features

### 🔑 Administrative Control Center
- **Dashboard Overview**: KPI panels displaying fleet counts, active routes, schedule timetables, and driver logs. Includes a dynamic SVG donut gauge charting active fleet utilization.
- **Recent Activities Feed**: Aggregated chronological log of recent bus, route, and schedule definitions.
- **Bus Fleet CRUD**: Register bus plate details, seating capacities, vehicle types (AC/Non-AC, Seater/Sleeper), assign drivers, and check active status.
- **Route CRUD**: Map start and end terminals and assign segment distances in kilometers. Restricts duplicate mappings.
- **Schedule CRUD**: Timetable builder to assign buses to route segments with departure and arrival time slots.
- **JWT Auth & Guards**: Secure, stateless admin sessions. Automatic route guards block unauthenticated entry and handle expired sessions.

### 🚌 Commuter Portal
- **Interactive Timetable Search**: Search schedules using Source and Destination keywords.
- **Detailed Itinerary Cards**: Visual journey timelines showing departure/arrival times, route distances, vehicle comfort options, and driver phone details.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Professional Royal Blue design tokens, Poppins typography, CSS Grid/Flexbox layouts), JavaScript (ES6 Fetch APIs, Auth guards, DOM injectors). No external CSS dependencies like Bootstrap.
- **Backend**: Node.js, Express.js (REST APIs, CORS configuration, JSON parsers, Static file hosting).
- **Database**: MySQL (Connection pooling, foreign key constraints, cascading deletions).

---

## 📁 Directory Structure

```
Smart-Bus
├── backend
│   ├── config/            # MySQL Pool configuration
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # JWT Authentication validator
│   ├── routes/            # REST API route directories
│   ├── server.js          # Node Express server
│   └── package.json       # Project dependencies & scripts
├── database
│   └── bus_management.sql # Database schema & seeds
├── docs
│   ├── SRS.md             # Software Requirements Specification
│   ├── Architecture.md    # System Architecture Document
│   ├── ER_Diagram.md      # Entity Relationship Diagrams
│   ├── Use_Case_Diagram.md # Actor Use Cases Diagram
│   ├── Flowchart.md       # Operational flowcharts
│   ├── API_Documentation.md # API specifications
│   ├── Testing.md         # QA checklist & test validations
│   └── Viva_Questions.md  # Viva Voce study guide
├── frontend
│   ├── css/
│   │   └── main.css       # Core stylesheet & CSS variables
│   ├── js/
│   │   ├── api.js         # API request wrapper
│   │   ├── auth.js        # Auth state guards
│   │   └── main.js        # Layout injectors & modals controller
│   ├── pages/
│   │   ├── bus.html       # Bus fleet editor
│   │   ├── dashboard.html # System metrics dashboard
│   │   ├── login.html     # Administrator login
│   │   ├── passenger.html # Passenger timetables view
│   │   ├── route.html     # Transit route editor
│   │   └── schedule.html  # Timetable schedule editor
│   └── index.html         # Landing switcher portal
└── README.md              # Documentation & guidelines
```

---

## 🚀 Setup & Installation

### Prerequisite Checklist
- **Node.js** (v16.0.0 or higher recommended)
- **MySQL Server** (v8.0 or higher recommended)

---

### Step 1: Database Initialization
1. Start your local MySQL Server.
2. Log into the MySQL terminal or MySQL Workbench.
3. Import the system schema and initial seeds:
   ```bash
   mysql -u root -p < database/bus_management.sql
   ```
   *(Replace `root` with your MySQL user name. You will be prompted to enter your password.)*

This script initializes the `bus_management` database and creates `Admin`, `Bus`, `Route`, and `Schedule` tables pre-loaded with mock records for testing.

---

### Step 2: Backend Configuration
1. Open the project directory, navigate to `backend/`, and duplicate the template:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Open `.env` and fill in your MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=bus_management
   DB_PORT=3306
   JWT_SECRET=smart_bus_secret_key_2026_poppins
   ```

---

### Step 3: Install & Start Development Server
1. Inside the `backend/` folder, run npm install:
   ```bash
   npm install
   ```
2. Start the Express server:
   ```bash
   npm start
   ```

The backend server will verify MySQL connectivity and output:
```
[Database] Successfully connected to MySQL at localhost:3306, Database: bus_management
================================================================
[Server] Server is running on port 5000
[Server] Local URL: http://localhost:5000
================================================================
```

---

### Step 4: Access the Application
Open your web browser and navigate to:
```
http://localhost:5000
```
- **Passenger Portal**: Directly accessible without registration to search schedules.
- **Admin Control Center**: Access via the portal selector or navigate to `http://localhost:5000/pages/login.html`.

#### Default Credentials
- **Email**: `admin@smartbus.com`
- **Password**: `admin123`
