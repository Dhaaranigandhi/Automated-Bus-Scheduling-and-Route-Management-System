# System Architecture & Design
## Smart Bus Scheduling and Route Management System

---

## 1. System Overview

The Smart Bus system utilizes a 3-Tier Web Architecture designed to separate concerns, maintain clean code, and run on a single port configuration.

```
       [ Client Tier ]                [ Server Tier ]              [ Database Tier ]
+---------------------------+   +-------------------------+   +-------------------------+
|                           |   |                         |   |                         |
|   HTML5 Semantic Layouts   |   |   Express.js Middleware  |   |   Connection Pool       |
|                           |   |   (CORS, JSON Parser)   |   |   (mysql2/promise)      |
|   Vanilla CSS Variables   |==>|                         |==>|                         |
|   (Poppins, Responsive)   |   |   Routing Controller    |   |   MySQL DB Schema       |
|                           |   |   (Auth, Bus, Schedule) |   |   (Admin, Bus, Route,   |
|   AJAX apiFetch Client    |   |                         |   |    Schedule tables)     |
|   (JWT Session Guards)    |   |   JWT Security Filter   |   |                         |
|                           |   |                         |   |                         |
+---------------------------+   +-------------------------+   +-------------------------+
```

---

## 2. Directory Structure

The project is structured to separate front-end static views, backend Express services, database configuration, and developer documentation:

```
Bus-Management-System
├── backend
│   ├── config/            # Database pool setup
│   ├── controllers/       # Route action business logic
│   ├── middleware/        # JWT Authentication checks
│   ├── routes/            # Route mapping to controllers
│   ├── server.js          # Express server entry point
│   └── package.json       # Node package manager configurations
├── database
│   └── bus_management.sql # MySQL database structure & mock seeds
├── docs
│   ├── SRS.md             # Software Requirements Specification
│   ├── Architecture.md    # Architecture review
│   ├── ER_Diagram.md      # Entity Relationship Diagrams
│   ├── Flowchart.md       # Application user flowcharts
│   ├── API_Documentation.md # API Endpoint requests/responses
│   ├── Testing.md         # QA checklist & test validation
│   └── Viva_Questions.md  # Academic review prep sheet
├── frontend
│   ├── css/
│   │   └── main.css       # Core layout styling & colors
│   ├── js/
│   │   ├── api.js         # HTTP Client and token attachments
│   │   ├── auth.js        # Admin auth guards & redirect hooks
│   │   └── main.js        # Reusable sidebars injector & modals
│   ├── pages/
│   │   ├── bus.html       # Bus fleet management panel
│   │   ├── dashboard.html # Statistics dashboard overview
│   │   ├── login.html     # Admin sign-in screen
│   │   ├── passenger.html # Timetable filter UI for commuters
│   │   ├── route.html     # Transit route configuration panel
│   │   └── schedule.html  # Fleet scheduling manager panel
│   └── index.html         # Landing switcher portal
└── README.md              # Installation and run guidelines
```

---

## 3. Tier Component Breakdown

### 3.1 Client Tier (Frontend)
- **Shared Layout Engine (`js/main.js`)**: Modifies the DOM at runtime. If the view requires layout scaffolding, it dynamically builds and injects the header and sidebar navigation, ensuring consistency across all pages and eliminating duplicate markup.
- **Route Guarding (`js/auth.js`)**: Intercepts routing. Evaluates the presence of `smart_bus_token` in `localStorage`. Redirects unauthorized users to the login screen and authenticated admins away from it.
- **API Fetch client (`js/api.js`)**: Encapsulates fetch queries, handles cross-origin requests, attaches bearer credentials, and intercepts authentication errors (401) to sign out expired sessions.
- **Responsive Layout (`css/main.css`)**: Utilizes custom CSS variables and CSS Grid configurations to adjust layouts dynamically from wide desktop screens down to mobile widths.

### 3.2 Server Tier (Backend)
- **Node Server (`server.js`)**: Directs HTTP requests, serves frontend assets, initializes CORS rules, and starts database connectivity tests.
- **JWT Middleware (`middleware/authMiddleware.js`)**: Inspects requests to protected endpoints. Checks for an `Authorization` header containing `Bearer <JWT_TOKEN>`. Decodes the payload and mounts user claims onto `req.admin`.
- **Controllers (`controllers/`)**: Encapsulate business logic. Query the database using SQL, handle error exceptions, and return structured JSON responses.

### 3.3 Database Tier (MySQL)
- **Relational Tables**: The database enforces integrity constraints:
  - `Admin`: Holds login credentials.
  - `Bus`: Holds vehicle specifications and operational status.
  - `Route`: Holds transit segments and distances.
  - `Schedule`: Links a `Bus` and `Route` mapping together.
- **Cascading Constraints**: The `Schedule` table specifies foreign key constraints referencing `BusID` and `RouteID` with `ON DELETE CASCADE`. Removing a vehicle or route automatically purges dependent schedules.
- **Pool connections**: Uses a connection limit of 10 to optimize database resource allocation and query performance under load.

---

## 4. Security Architecture

1. **Password Safety**: Enforced in the database. Raw text passwords are never stored. The system verifies logins by comparing inputs with salted hashes generated by `bcryptjs`.
2. **Stateless Sessions**: JWT tokens containing admin claims are generated with a 24-hour expiration. The backend remains stateless, validating sessions on each request by verifying token signatures.
