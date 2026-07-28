# API Documentation — RouteWise (TransitFlow)

This document catalogs the REST API endpoints, input validation criteria, and authorization gates for the platform.

---

## 🔑 Authentication & Profiles

### 1. User Sign In
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Auth Requirement**: Public (Guest)
* **Request Schema**:
  ```json
  {
    "email": "admin@transitflow.com",
    "password": "admin123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "admin": {
      "id": 1,
      "email": "admin@transitflow.com",
      "name": "Super Admin User",
      "role": { "name": "Super Administrator" }
    }
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password combination"
  }
  ```

---

## 🚌 Bus Fleet Management

### 1. Retrieve Fleet Inventory
* **Method**: `GET`
* **Path**: `/api/buses`
* **Auth Requirement**: JWT Access Token (Transport Manager, Dispatcher, Scheduler)
* **Query Options**: `?search=KA-01`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "buses": [
      {
        "id": 1,
        "registrationNumber": "KA-01-F-1234",
        "model": "Volvo B11R",
        "capacity": 45,
        "status": "AVAILABLE",
        "category": "AC_SEATER"
      }
    ]
  }
  ```

---

## 🗺️ Transit Routes & Multi-Stop GIS

### 1. Define Multi-Stop Route
* **Method**: `POST`
* **Path**: `/api/routes`
* **Auth Requirement**: JWT Access Token (Transport Manager, Super Administrator)
* **Request Schema**:
  ```json
  {
    "name": "Majestic to Electronic City",
    "startLocation": "Majestic Bus Stand",
    "endLocation": "Electronic City Phase 1",
    "stops": [
      { "stopName": "Majestic Terminal", "stopOrder": 1, "latitude": 12.9778, "longitude": 77.5706 },
      { "stopName": "Shanti Nagar", "stopOrder": 2, "latitude": 12.9539, "longitude": 77.5963 }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "route": {
      "id": 1,
      "name": "Majestic to Electronic City",
      "totalDistance": 22.50,
      "totalDuration": 45
    }
  }
  ```
