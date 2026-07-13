# Software Requirement Specification (SRS)
## Smart Bus Scheduling and Route Management System

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the **Smart Bus Scheduling and Route Management System**. It outlines the functional scope, user profiles, performance metrics, and security mechanisms required to build a digitized bus schedule platform.

### 1.2 Scope
The Smart Bus system replaces manual ledger-based bus fleet and schedule logs with a modern centralized database platform. 
- **Admin Portal**: Allows system operators to maintain administrative registries for vehicles, configure routing segments, and assign dynamic timetables.
- **Passenger Portal**: Allows commuters to search for transit buses between locations and check real-time schedule timetables.

### 1.3 Definitions, Acronyms, and Abbreviations
- **JWT**: JSON Web Token, used for secure stateless session authentication.
- **CRUD**: Create, Read, Update, and Delete database operations.
- **KPI**: Key Performance Indicators, dashboard metric graphs.
- **SRS**: Software Requirement Specification.

---

## 2. Overall Description

### 2.1 Product Perspective
The system is built as a web-based, database-driven application with a decoupled backend API architecture and static frontend layout assets.

```
+-------------------------------------------------------+
|                     Client Browser                    |
|  (Landing Page, Admin Panel, Timetables, Search UI)   |
+-------------------------------------------+-----------+
                                            |
                                      HTTP  |  REST API
                                            v
+-------------------------------------------+-----------+
|                   Node.js Express Server              |
|        (Router, JWT Authentication, Controllers)      |
+-------------------------------------------+-----------+
                                            |
                                SQL Queries |  Connection Pool
                                            v
+-------------------------------------------+-----------+
|                       MySQL Database                  |
|          (Admin, Bus, Route, Schedule Tables)         |
+-------------------------------------------------------+
```

### 2.2 Product Functions
1. **Authentication**: Secure admin login and validation.
2. **Dashboard Summary**: Graphing and statistics of system state.
3. **Bus Fleet Registry**: Complete CRUD interface for bus records.
4. **Route Configurator**: Setup and modification of transit nodes.
5. **Schedule Mapper**: Timetable builder joining buses and routes.
6. **Commuter Timetable Search**: Search filters for passengers based on source/destination.

### 2.3 User Classes and Characteristics
- **System Administrator**: Technically proficient, manages databases, logs, vehicle updates, and schedules. Needs access to all management modules.
- **Passenger (Commuter)**: Requires no registration. Navigates the timetables to search for bus timings.

### 2.4 Design and Implementation Constraints
- **No Third-Party Stylesheets**: The layout must be coded in vanilla CSS without Bootstrap.
- **Database Engine**: Relational storage must utilize MySQL.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 Authentication Module (Admin)
- **Log In**: Admin inputs email and password. Server verifies the bcrypt hash and returns a signed 24h JWT.
- **Log Out**: Client drops stored credentials and routes back to the login screen.

#### 3.1.2 Dashboard KPI Module
- **KPI Summary**: Dynamically counts:
  - Total registered buses.
  - Total routes.
  - Active schedules.
  - Active drivers.
- **Charts**: Circle-segment Donut graphic showing active vs inactive fleet allocation.
- **Recent Activities**: A chronological timeline displaying the last 5 logs.

#### 3.1.3 Bus Management Module (CRUD)
- **Add Bus**: Input validation for registration numbers (unique), driver contact details, seat capacity, and layout types.
- **Edit Bus**: Update contact numbers, types, capacity, and active/inactive status.
- **Delete Bus**: Delete vehicles from the registry, cascading deletions to linked schedules.

#### 3.1.4 Route Management Module (CRUD)
- **Add Route**: Inputs source, destination, and distance (positive decimal). Rejects duplicate route combinations.
- **Edit Route**: Modify source/destination text and distance values.
- **Delete Route**: Deletes routing maps, cascading deletions to schedules.

#### 3.1.5 Schedule Management Module (CRUD)
- **Create Schedule**: Selects a bus and route from dynamic dropdowns, sets departure/arrival times, and sets schedule status.
- **Edit Schedule**: Update timetable slots, bus assignments, and routes.
- **Delete Schedule**: Cancels the timetable event.

#### 3.1.6 Passenger Search Module
- **Filter Timetables**: Users enter partial or complete Source/Destination terms.
- **Itinerary Card Rendering**: Displays matching active schedules, driver contacts, vehicle details, departure/arrival times, and trip distances.

---

## 4. Non-Functional Requirements

### 4.1 Security
- Password credentials stored securely in MySQL using bcrypt salt hashing.
- Admin APIs protected behind JSON Web Token (JWT) validation filters.

### 4.2 Usability
- Implements a responsive design using media query layout breaks to support desktop, tablet, and mobile views.
- Hover states, cursor hints, and modal overlays.

### 4.3 Performance
- MySQL connection pooling to optimize database performance.
- Debounced input filtering on data tables to prevent redundant API queries.
