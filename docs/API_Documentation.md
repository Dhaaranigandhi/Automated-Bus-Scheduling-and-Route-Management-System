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
* **Query Options**: `?search=DL-01`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "buses": [
      {
        "id": 1,
        "registrationNumber": "DL-01-AB-1234",
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
    "name": "Kashmere Gate to Anand Vihar ISBT",
    "startLocation": "Kashmere Gate ISBT",
    "endLocation": "Anand Vihar ISBT",
    "stops": [
      { "stopName": "Kashmere Gate ISBT", "stopOrder": 1, "latitude": 28.6675, "longitude": 77.2282 },
      { "stopName": "Connaught Place", "stopOrder": 2, "latitude": 28.6304, "longitude": 77.2177 }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "route": {
      "id": 1,
      "name": "Kashmere Gate to Anand Vihar ISBT",
      "totalDistance": 22.50,
      "totalDuration": 45
    }
  }
  ```
