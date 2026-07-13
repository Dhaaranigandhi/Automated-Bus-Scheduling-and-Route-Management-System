# Use Case Diagram
## Smart Bus Scheduling and Route Management System

This document outlines the system boundary and visualizes the interactions between the two primary actors (Admin and Passenger) and the application.

```mermaid
leftToRightDirection
actor Admin as "System Administrator"
actor Passenger as "Passenger / Commuter"

rectangle "Smart Bus Scheduling System" {
    usecase UC1 as "Secure Login"
    usecase UC2 as "View Dashboard KPIs"
    usecase UC3 as "Manage Buses (CRUD)"
    usecase UC4 as "Manage Routes (CRUD)"
    usecase UC5 as "Manage Schedules (CRUD)"
    usecase UC6 as "View Fleet Reports"
    usecase UC7 as "Log Out"

    usecase UC8 as "Search Bus Timetable"
    usecase UC9 as "Filter Routes"
    usecase UC10 as "View Active Schedules"
}

Admin --> UC1
Admin --> UC2
Admin --> UC3
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC7

Passenger --> UC8
Passenger --> UC9
Passenger --> UC10
```

---

## Actor Use Case Descriptions

### 1. System Administrator
- **Secure Login**: Access control login using encrypted credentials.
- **View Dashboard KPIs**: Inspect status ratios of buses, drivers, routes, and active schedules.
- **Manage Buses**: Add new fleet vehicles, update driver contact assignments, edit capacities, and delete buses (cascading schedules).
- **Manage Routes**: Add start/end segments and calculate distance parameters.
- **Manage Schedules**: Formulate operational timetables linking vehicles to transit paths.
- **View Fleet Reports**: Analyze fleet parameters, drivers, and recent transaction feeds.
- **Log Out**: Terminate administrative sessions and clear JWT state.

### 2. Passenger / Commuter
- **Search Bus Timetable**: Filter buses using source terminals.
- **Filter Routes**: Refine route listings using destination terms.
- **View Active Schedules**: Check departure timings, arrival expectations, distance details, and driver contact cards.
