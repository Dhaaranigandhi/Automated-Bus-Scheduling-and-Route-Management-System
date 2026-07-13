# System Testing Report
## Smart Bus Scheduling and Route Management System

This document outlines the testing strategy, test cases, and quality checks performed on the Smart Bus Scheduling System.

---

## 1. Testing Strategy

The testing process focuses on three validation areas:
1. **Functional Correctness**: Ensuring that CRUD operations persist correctly to the database, inputs are validated, and authentication route guards block unauthorized access.
2. **Data Integrity & Relational Rules**: Validating database constraint checks, unique index blocks, and foreign key cascade executions (deleting a bus cascades to delete schedules).
3. **Usability & UI responsiveness**: Verifying cross-device grid scaling, button active colors, hover transformations, and form modal behaviors.

---

## 2. Test Cases and Scenarios

### 2.1 Admin Authentication

| Test ID | Test Scenario | Input Data | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :---: |
| AUTH-01 | Admin login with valid credentials | Email: `admin@smartbus.com`<br>Password: `admin123` | - Returns JWT token<br>- Stores claims in LocalStorage<br>- Redirects to `dashboard.html` | **Pass** |
| AUTH-02 | Admin login with invalid password | Email: `admin@smartbus.com`<br>Password: `wrong_pass` | - Returns 401 Unauthorized status<br>- Renders red error banner: "Invalid email or password" | **Pass** |
| AUTH-03 | Unauthenticated access to dashboard | Directly navigate to `pages/dashboard.html` | - Auth guard intercepts request<br>- Redirects user to `pages/login.html` | **Pass** |
| AUTH-04 | Admin sign-out workflow | Click logout button in sidebar | - Clears JWT token from LocalStorage<br>- Redirects user to `pages/login.html` | **Pass** |

### 2.2 Bus Fleet Management (CRUD)

| Test ID | Test Scenario | Input Data | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :---: |
| BUS-01 | Register a valid new bus | Number: `KA-05-AB-5678`<br>Driver: `Harish Gowda`<br>Contact: `9900112233`<br>Seats: `40`<br>Type: `AC Seater` | - Insert returns status 201<br>- Close modal form<br>- Refreshes list table to show entry | **Pass** |
| BUS-02 | Reject duplicate bus registration | BusNumber: `KA-01-F-1234` (existing) | - Server rejects query<br>- Form shows error banner: "Bus number KA-01-F-1234 is already registered" | **Pass** |
| BUS-03 | Edit bus details | Update seating capacity to `48` | - DB records updated<br>- List refreshes immediately showing `48 seats` | **Pass** |
| BUS-04 | Delete bus with cascade schedule check | Click delete on Bus `KA-01-F-1234` | - Deletes bus record from `Bus`<br>- Cascades and purges schedules in `Schedule`<br>- Refreshes tables | **Pass** |

### 2.3 Route Configuration (CRUD)

| Test ID | Test Scenario | Input Data | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :---: |
| ROUTE-01 | Define a valid new route | Source: `Silk Board`<br>Dest: `Whitefield`<br>Dist: `18.5` | - Path saved to DB<br>- List table updates | **Pass** |
| ROUTE-02 | Reject duplicate route | Same source/destination segment | - Server rejects duplication query<br>- Form displays route alert error | **Pass** |
| ROUTE-03 | Reject negative distance inputs | Distance: `-15` | - Form prevents submission or backend returns validation error | **Pass** |

### 2.4 Schedule Timetable Configuration

| Test ID | Test Scenario | Input Data | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :---: |
| SCH-01 | Create a valid timetable schedule | Bus: `#1`<br>Route: `#1`<br>Dep: `08:00`<br>Arr: `09:15` | - Schedule mapping successfully saved<br>- Timetable table updates | **Pass** |
| SCH-02 | Verify relationship option loads | Open Add Schedule modal | - Dropdowns populate with buses and routes list fetched from API | **Pass** |

### 2.5 Passenger Timetable Search

| Test ID | Test Scenario | Input Data | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :---: |
| PASS-01 | Load default passenger page | Open `passenger.html` | - Loads and displays all active schedules in a list | **Pass** |
| PASS-02 | Filter schedules by search parameters | Source: `Majestic`<br>Dest: `Electronic City` | - Filters list cards<br>- Count label updates showing total matched runs | **Pass** |
| PASS-03 | Search with no matched segments | Source: `Unknown`<br>Dest: `Unknown` | - Shows clear no-results alert banner with a retry tip | **Pass** |

---

## 3. Responsive Layout Check

- **Desktop (1200px+)**: Sidebar remains fixed on the left, dashboard charts display side-by-side with recent activity panels, data tables show full columns.
- **Tablet (768px - 1024px)**: Data tables collapse scrollable content blocks, sidebar locks position, font sizes scale down slightly, donut charts adjust margins.
- **Mobile (Below 768px)**: Sidebar slides out of view and toggles on hamburger click in the top header. Form inputs wrap vertically, search widgets adapt to single columns.
