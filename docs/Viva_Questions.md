# Viva / Project Defense Questions and Answers
## Smart Bus Scheduling and Route Management System

This guide prepares students and developers for project reviews, oral examinations (viva-voce), and technical walkthrough defenses.

---

## 1. Core Architecture & Backend Questions

### Q1: Explain the overall system architecture of your project.
**A**: The project is designed using a **3-Tier Web Architecture**:
- **Presentation Tier (Frontend)**: Standard HTML5, vanilla CSS3, and JavaScript APIs. The UI is completely responsive and serves as an interactive administration panel and commuter search dashboard.
- **Application Tier (Backend)**: Built with Node.js and Express.js, providing RESTful API endpoints for auth sessions, CRUD management, and dashboard activity metrics.
- **Data Tier (Database)**: Implemented on a MySQL database, storing relational structures for Admins, Buses, Routes, and Schedules.

### Q2: Why did you choose Node.js and Express.js for the backend?
**A**: Node.js uses an asynchronous, event-driven, non-blocking I/O model, making it efficient for data-intensive real-time web applications. Express.js is a minimalist, fast framework that provides robust routing control, simplifies middleware integration (like CORS and JSON parsing), and connects to database drivers efficiently.

### Q3: What is the role of `package.json` in your backend directory?
**A**: `package.json` is the manifest file for Node.js projects. It registers project details (version, entry point `server.js`), defines command scripts (like `npm start` and `npm run dev`), and lists dependencies (like `express`, `mysql2`, `jsonwebtoken`, `bcryptjs`, and `cors`) along with their semantic version rules.

---

## 2. Database Design & SQL Questions

### Q4: Detail your database schema. How many tables do you have and how do they relate?
**A**: The database schema contains **four tables**:
1. `Admin`: Stores system administrators (id, name, email, password hash).
2. `Bus`: Stores vehicle registry details (license number, driver details, seat count, and type).
3. `Route`: Stores routing terminals (source, destination, and distance).
4. `Schedule`: Acts as a junction table connecting `Bus` and `Route` details. It contains times of departure/arrival and operational status.
- **Relationships**: There is a **One-to-Many (1:N)** relationship from `Bus` to `Schedule` and a **One-to-Many (1:N)** relationship from `Route` to `Schedule`.

### Q5: What are Foreign Keys? How are they configured in your database?
**A**: A Foreign Key is a field in one table that references the Primary Key of another table, ensuring referential data integrity. In our system, the `Schedule` table contains `BusID` and `RouteID` foreign keys referencing their parent tables:
- They are defined with `ON DELETE CASCADE ON UPDATE CASCADE`. This constraint ensures that if a bus or route is deleted from the system, all scheduled trips associated with that bus or route are automatically deleted, preventing dangling records.

### Q6: How do you query schedules while returning detailed bus and route names?
**A**: We write a SQL query containing **INNER JOIN** operations:
```sql
SELECT s.*, b.BusNumber, r.Source, r.Destination 
FROM Schedule s
INNER JOIN Bus b ON s.BusID = b.BusID
INNER JOIN Route r ON s.RouteID = r.RouteID;
```
This merges related rows based on matching primary-foreign key values into a single comprehensive dataset.

---

## 3. Security & Session Questions

### Q7: How are administrator passwords secured in this application?
**A**: Passwords are never stored in plain text. Instead, we use the `bcryptjs` library to perform one-way cryptographic hashing:
- On admin creation, the password is combined with a random salt value and hashed.
- During login, the server retrieves the stored hash, hashes the incoming password string with the same salt parameters, and compares the outputs via a time-safe compare algorithm.

### Q8: What is JWT? How does your token authentication workflow operate?
**A**: **JWT (JSON Web Token)** is an open standard for securely transmitting information between parties as a JSON object.
- **Generation**: On successful admin login, the server generates a token containing admin details signed with a secret key (`JWT_SECRET`).
- **Storage**: The token is saved on the client browser in `localStorage`.
- **Transmission**: The client attaches this token inside the `Authorization: Bearer <token>` header for subsequent administrative API requests.
- **Verification**: The auth middleware on the backend intercepts the request, verifies the token's cryptographic signature, and grants access if valid.

---

## 4. Frontend & Layout Questions

### Q9: How did you implement the "Professional Royal Blue" layout without Bootstrap?
**A**: We designed the frontend using vanilla CSS3. We defined a custom design token system in `css/main.css` using **CSS custom properties (variables)**:
- Primary Color: `#2563EB`
- Sidebar Background: `#1E3A8A`
- Cards & Content Blocks: `#FFFFFF`
- App Background: `#F8FAFC`
Layout positioning is managed using CSS Grid and Flexbox for responsive scaling, and shadows (`box-shadow`) are configured to create layers and elevations.

### Q10: How do your admin pages share sidebar and header navigation without code duplication?
**A**: We built a dynamic **Layout Injector** script in `js/main.js`. 
- Each admin page has a wrapper element `<div id="layout-wrapper" class="app-container">`.
- On page load, `main.js` detects this wrapper, dynamically builds the sidebar and header HTML strings, and injects them into the DOM.
- It automatically evaluates the browser pathname to apply the `.active` CSS class to the corresponding sidebar navigation tab.
- This provides a single source of truth: modifying navigation links only requires updating `js/main.js` instead of editing six separate HTML pages.
