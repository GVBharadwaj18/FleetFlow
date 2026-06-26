# 🚗 Vehicle Management System (VMS)

A full-stack application to manage vehicles, owners, maintenance records, invoices, and categories — built with Node.js, MongoDB, and React.

---

## 📦 Features

- Add / Edit / Delete Vehicles  
- Categorize vehicles (e.g., car, motorcycle, truck)  
- Manage Owners / Customers  
- Record maintenance and service history  
- **Invoice Management (Bills)** with service items and total price calculation  
- Login / Authentication with JWT  
- Store and retrieve data via MongoDB  
- Protected frontend routes  
- Clean and responsive UI with TailwindCSS 
- Archive and restore invoices (soft delete)
- Dashboard with recent maintenances and invoices 
- **Unit & Integration Tests** for backend using Jest and Supertest  
- **In-memory test database** with `mongodb-memory-server`  
- **CI pipeline with GitHub Actions**  

---

## 🛠 Tech Stack

- **Frontend**: React + Vite + TailwindCSS + React Hook Form  
- **Backend**: Node.js + Express + MongoDB + Mongoose  
- **Auth**: JWT  
- **Data Storage**: MongoDB Atlas / local MongoDB  
- **Testing**: Jest, Supertest, mongodb-memory-server  
- **CI/CD**: GitHub Actions  
- **Other Tools**: Axios, React Router, dotenv, nodemon, Postman, Git  

---

## 📁 Folder Structure

```bash
VMS/
│
├── frontend/             # React frontend
│   └── src/pages         # Login, Vehicles, Maintenance, Invoices
│   └── src/components    # UI components (Form, Modal, Table)
│
├── backend/              # Express backend
│   └── models            # Mongoose schemas
│   └── controllers       # Logic for each route
│   └── routes            # REST API endpoints
│   └── tests             # Backend test cases (Jest + Supertest)
│
├── .github/workflows     # CI config (GitHub Actions)
├── seed.js               # Initial data for DB
└── .gitignore
```

---

## ▶️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/vms-project.git
cd vms-project
```

### 2. Setup backend

```bash
cd backend
npm install
node index.js
```

### 3. Setup frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Create `.env` file in `/backend`

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## ✅ Running Tests

🧪 Backend tests (Jest + Supertest + mongodb-memory-server)

```bash
cd backend
npm test
```

> All test suites run against a fast in-memory MongoDB instance (no real data affected).

---

## 🔁 CI (Continuous Integration)

GitHub Actions runs lint and test jobs automatically on every push or pull request to `main`.  
Check `.github/workflows/ci.yml` for details.

---

## 💡 Author

**[Your Name]**  
[GitHub Profile](https://github.com/YOUR_USERNAME)  
[LinkedIn Profile](https://linkedin.com/in/YOUR_USERNAME)

---

## ✅ To Do / In Progress

- [x] Implement Invoice (Bill) CRUD
- [x] Total price calculation from services  
- [x] Filter invoices by customer/vehicle  
- [x] Protect routes with JWT middleware  
- [x] Add Delete & Edit functionality to invoices  
- [x] Backend test coverage  
- [x] CI with GitHub Actions  
- [x] Print invoice as PDF 
- [x] Add invoice archive functionality and archived bills page
- [x] Create dashboard with recent maintenances and invoices section 
- [ ] Optional: Pagination & search  


### 📌 Next Feature Ideas

1. **Reports & Analytics**  
   - Create a Reports page in the frontend  
   - Show monthly revenue (from invoices) with a chart  
   - Display number of maintenances/services in a selectable time range  
   - Identify most used parts from `partsUsed`  
   - Implement backend APIs for aggregated statistical data  

2. **Inventory Management for Parts**  
   - Add `stock` field to the `Part` model  
   - Reduce stock when a part is used in a maintenance record  
   - Show low-stock warnings on the dashboard  
   - API to update stock and record new part orders
   - Part order button  
   - Display a list of orders placed for a specific item

3. **Booking & Appointment System**  
   - Create a new `Booking` model with customer, vehicle, date, and description  
   - Allow customers to create bookings via the UI  
   - Allow admin to approve, reject, or mark bookings as completed  
   - Filter and display bookings by status (pending, approved, completed)  
   