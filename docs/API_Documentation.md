# REST API Documentation
## Smart Bus Scheduling and Route Management System

This document outlines the API endpoints, authentication requirements, and payload schemas for the Smart Bus system backend.

---

## Base Configuration
- **Base URL**: `/api` (or `http://localhost:5000/api` during local debugs)
- **Content-Type**: `application/json`
- **Security Header**: `Authorization: Bearer <JWT_TOKEN>` (required on protected admin routes)

---

## 1. Authentication Endpoints

### 1.1 Admin Login
- **Endpoint**: `POST /auth/login`
- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "email": "admin@smartbus.com",
  "password": "admin123"
}
```
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@smartbus.com"
  }
}
```
- **Response (Failure - 401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### 1.2 Get Admin Profile
- **Endpoint**: `GET /auth/profile`
- **Authentication**: JWT Token Required
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "admin": {
    "AdminID": 1,
    "Name": "System Admin",
    "Email": "admin@smartbus.com"
  }
}
```

---

## 2. Bus Fleet Endpoints

### 2.1 Get All Buses
- **Endpoint**: `GET /buses`
- **Authentication**: None (Public)
- **Query Parameters**:
  - `search` (Optional): Matches string terms against BusNumber, DriverName, or BusType.
  - `status` (Optional): Filters by operational status (`Active` or `Inactive`).
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "buses": [
    {
      "BusID": 1,
      "BusNumber": "KA-01-F-1234",
      "DriverName": "Ramesh Kumar",
      "DriverContact": "9876543210",
      "Capacity": 45,
      "BusType": "AC Seater",
      "Status": "Active"
    }
  ]
}
```

### 2.2 Create New Bus
- **Endpoint**: `POST /buses`
- **Authentication**: JWT Token Required
- **Request Body**:
```json
{
  "busNumber": "KA-01-F-9999",
  "driverName": "Rajesh Gowda",
  "driverContact": "9998887776",
  "capacity": 42,
  "busType": "AC Sleeper",
  "status": "Active"
}
```
- **Response (Success - 201 Created)**:
```json
{
  "success": true,
  "message": "Bus successfully added.",
  "busId": 5
}
```

### 2.3 Update Bus
- **Endpoint**: `PUT /buses/:id`
- **Authentication**: JWT Token Required
- **Request Body**: Same schema as POST.
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Bus details updated successfully."
}
```

### 2.4 Delete Bus
- **Endpoint**: `DELETE /buses/:id`
- **Authentication**: JWT Token Required
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Bus deleted successfully."
}
```

---

## 3. Route Configuration Endpoints

### 3.1 Get All Routes
- **Endpoint**: `GET /routes`
- **Authentication**: None (Public)
- **Query Parameters**:
  - `search` (Optional): Matches strings in Source or Destination fields.
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "routes": [
    {
      "RouteID": 1,
      "Source": "Majestic, Bangalore",
      "Destination": "Electronic City, Bangalore",
      "Distance": "22.50"
    }
  ]
}
```

### 3.2 Create Route
- **Endpoint**: `POST /routes`
- **Authentication**: JWT Token Required
- **Request Body**:
```json
{
  "source": "Kengeri, Bangalore",
  "destination": "Mysore Road, Bangalore",
  "distance": 14.50
}
```
- **Response (Success - 201 Created)**:
```json
{
  "success": true,
  "message": "Route successfully added.",
  "routeId": 5
}
```

### 3.3 Update Route
- **Endpoint**: `PUT /routes/:id`
- **Authentication**: JWT Token Required
- **Request Body**: Same schema as POST.
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Route details updated successfully."
}
```

### 3.4 Delete Route
- **Endpoint**: `DELETE /routes/:id`
- **Authentication**: JWT Token Required
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Route deleted successfully."
}
```

---

## 4. Schedule Timetable Endpoints

### 4.1 Get All Schedules
- **Endpoint**: `GET /schedules`
- **Authentication**: None (Public)
- **Query Parameters**:
  - `source` (Optional): Filter routes originating here.
  - `destination` (Optional): Filter routes ending here.
  - `busId` (Optional): Filter schedules using this bus ID.
  - `routeId` (Optional): Filter schedules using this route ID.
  - `status` (Optional): Filters by Active/Inactive status.
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "schedules": [
    {
      "scheduleId": 1,
      "departureTime": "08:30:00",
      "arrivalTime": "09:30:00",
      "status": "Active",
      "bus": {
        "busId": 1,
        "busNumber": "KA-01-F-1234",
        "driverName": "Ramesh Kumar",
        "driverContact": "9876543210",
        "capacity": 45,
        "busType": "AC Seater",
        "status": "Active"
      },
      "route": {
        "routeId": 1,
        "source": "Majestic, Bangalore",
        "destination": "Electronic City, Bangalore",
        "distance": "22.50"
      }
    }
  ]
}
```

### 4.2 Create Schedule
- **Endpoint**: `POST /schedules`
- **Authentication**: JWT Token Required
- **Request Body**:
```json
{
  "busId": 1,
  "routeId": 1,
  "departureTime": "11:30:00",
  "arrivalTime": "12:45:00",
  "status": "Active"
}
```
- **Response (Success - 201 Created)**:
```json
{
  "success": true,
  "message": "Schedule successfully created.",
  "scheduleId": 5
}
```

### 4.3 Update Schedule
- **Endpoint**: `PUT /schedules/:id`
- **Authentication**: JWT Token Required
- **Request Body**: Same schema as POST.
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Schedule details updated successfully."
}
```

### 4.4 Delete Schedule
- **Endpoint**: `DELETE /schedules/:id`
- **Authentication**: JWT Token Required
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "message": "Schedule deleted successfully."
}
```

---

## 5. Dashboard Reports Endpoints

### 5.1 Get Dashboard Statistics
- **Endpoint**: `GET /reports/dashboard-stats`
- **Authentication**: JWT Token Required
- **Response (Success - 200 OK)**:
```json
{
  "success": true,
  "stats": {
    "buses": { "total": 4, "active": 3, "inactive": 1 },
    "routes": { "total": 4 },
    "schedules": { "total": 4, "active": 4 },
    "drivers": { "total": 4 }
  },
  "recentActivities": [
    {
      "id": "schedule-4",
      "type": "schedule",
      "title": "New Schedule Assigned",
      "description": "Bus KA-01-F-1234 scheduled from Majestic, Bangalore to Bannerghatta, Bangalore at 17:30:00.",
      "status": "Active",
      "rawId": 4
    }
  ]
}
```
