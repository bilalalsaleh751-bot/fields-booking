<img src="frontend/public/logo.png" width="900" alt="Project Preview">


# Fields Booking Platform

MERN stack booking platform for sports fields in Lebanon.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Authentication:** JWT

## Setup Instructions

### Prerequisites

- Node.js 20+ (or 22+ recommended)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (or next available port)

### Database Setup

1. Create `.env` file in `backend/` directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

2. Seed initial data:
```bash
cd backend
node scripts/seedAdmin.js          # Creates super admin
node scripts/seedSportTypes.js      # Creates sport types
```

### Default Admin Credentials

After running `seedAdmin.js`:
- Email: `admin@sportlebanon.com`
- Password: `Admin123!`

**⚠️ Change password after first login!**

## Project Structure

```
fields-booking/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   └── scripts/         # Seed scripts
├── frontend/
│   ├── src/
│   │   ├── admin/       # Admin dashboard
│   │   ├── dashboard/   # Owner dashboard
│   │   ├── account/     # User account
│   │   ├── pages/       # Public pages
│   │   └── components/  # Shared components
│   └── public/
└── README.md
```

## Features

- **Unified Login:** Single `/login` page for all roles (User/Owner/Admin)
- **Role-Based Access:** User/Owner/Admin dashboards with proper isolation
- **Dynamic CMS:** Admin controls all content (Homepage, Footer, Banners, FAQs, Sport Types)
- **Real-time Updates:** Polling and cache-busting for live data
- **Field Management:** Owners can create/manage fields with dropdowns (no free text)
- **Booking System:** Users book fields, owners manage bookings

## API Endpoints

### Auth
- `POST /api/auth/login` - Unified login
- `GET /api/auth/me` - Get current user

### Public
- `GET /api/public/sport-types` - Active sport types
- `GET /api/public/cities` - Cities with areas
- `GET /api/public/homepage` - Homepage content
- `GET /api/public/footer` - Footer content

### Admin (Protected)
- `GET /api/admin/cms/sport-types` - List sport types
- `POST /api/admin/cms/sport-types` - Create sport type
- `PUT /api/admin/cms/sport-types/:id` - Update sport type
- `DELETE /api/admin/cms/sport-types/:id` - Delete sport type

## Troubleshooting

### Port Already in Use
If port 5173 is in use, Vite will automatically try the next available port (5174, 5175, etc.)

### Node Version Issues
Use Node.js 20+ or 22+. If using nvm:
```bash
nvm use 22
```

### CORS Errors
Ensure backend CORS is configured to allow frontend origin.

### Authentication Issues
- Check JWT_SECRET matches in backend
- Verify token is stored correctly in localStorage
- Check `/api/auth/me` endpoint returns correct user data

## Development

### Running Both Servers

You can use `concurrently` to run both servers:

```bash
npm install -g concurrently
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

Or create a root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\""
  }
}
```

## License

Private project - All rights reserved

