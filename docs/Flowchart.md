# System Flowcharts
## Smart Bus Scheduling and Route Management System

This document outlines the operational logic and navigation pathways for both administrators and passenger users.

---

## 1. Administrative Workflow

This diagram illustrates the login validation checks, access guards, dashboard controls, and database operations available to system administrators.

```mermaid
flowchart TD
    Start([System Entry]) --> SelectAdmin[Select Admin Console]
    SelectAdmin --> CheckToken{JWT Token in LocalStorage?}
    
    CheckToken -- Yes --> Dashboard[Admin Dashboard]
    CheckToken -- No --> LoginScreen[Login Screen]
    
    LoginScreen --> SubmitForm[Input Email & Password]
    SubmitForm --> ApiLogin[API POST: /api/auth/login]
    
    ApiLogin --> Validate{Valid Credentials?}
    Validate -- No --> ShowError[Display Error Banner]
    ShowError --> LoginScreen
    
    Validate -- Yes --> SaveToken[Save JWT & User Info in LocalStorage]
    SaveToken --> Dashboard
    
    Dashboard --> NavMenu{Select Navigation Option}
    
    NavMenu -- Buses --> BusCRUD[Bus Fleet Management]
    BusCRUD --> BusActions{Action?}
    BusActions -- Search/Filter --> LoadBuses[Fetch /api/buses]
    BusActions -- Add/Edit --> BusForm[Submit Modal Form] --> SaveBus[POST/PUT /api/buses] --> LoadBuses
    BusActions -- Delete --> ConfirmDeleteBus[Confirm Dialog] --> DeleteBus[DELETE /api/buses] --> LoadBuses
    
    NavMenu -- Routes --> RouteCRUD[Transit Routes Configuration]
    RouteCRUD --> RouteActions{Action?}
    RouteActions -- Search/Filter --> LoadRoutes[Fetch /api/routes]
    RouteActions -- Add/Edit --> RouteForm[Submit Modal Form] --> SaveRoute[POST/PUT /api/routes] --> LoadRoutes
    RouteActions -- Delete --> ConfirmDeleteRoute[Confirm Dialog] --> DeleteRoute[DELETE /api/routes] --> LoadRoutes

    NavMenu -- Schedules --> ScheduleCRUD[Schedule Timetable Builder]
    ScheduleCRUD --> ScheduleActions{Action?}
    ScheduleActions -- Search/Filter --> LoadSchedules[Fetch /api/schedules]
    ScheduleActions -- Add/Edit --> ScheduleForm[Submit Modal Form] --> SaveSchedule[POST/PUT /api/schedules] --> LoadSchedules
    ScheduleActions -- Delete --> ConfirmDeleteSched[Confirm Dialog] --> DeleteSched[DELETE /api/schedules] --> LoadSchedules

    NavMenu -- Logout --> LogoutAction[Trigger Auth.logout] --> ClearStorage[Clear LocalStorage] --> Exit([Redirect to Login Screen])
```

---

## 2. Passenger / Commuter Workflow

This diagram illustrates how passengers navigate the portal to search for buses and view timetables without requiring account registration.

```mermaid
flowchart TD
    StartPassenger([Enter Passenger Portal]) --> LoadAll[Fetch all active schedules: GET /api/schedules?status=Active]
    LoadAll --> RenderCards[Render Itinerary Cards]
    
    RenderCards --> InputSearch[Enter Source and/or Destination]
    InputSearch --> ClickSearch[Click Search Buses]
    
    ClickSearch --> ApiSearch[GET /api/schedules?status=Active&source=...&destination=...]
    
    ApiSearch --> CheckResults{Results Found?}
    
    CheckResults -- Yes --> UpdateList[Render Filtered Cards]
    CheckResults -- No --> RenderNoResults[Render 'No Schedules Found' Alert]
    
    UpdateList --> ViewDetails[View Bus Number, Timings, Driver Name, and Contact Number]
    RenderNoResults --> ClickReset[Click Reset Filters] --> LoadAll
```
