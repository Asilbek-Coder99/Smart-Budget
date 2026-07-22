# 💰 Smart Budget — Personal Finance Management System

Graduation project — Full-stack React + Node.js + PostgreSQL

---

## ⚡ Tez ishga tushirish

### Talab qilinadigan dasturlar
| Dastur | Versiya |
|--------|---------|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| npm | 9+ |

---

### 1. PostgreSQL bazasini yarating
```bash
psql -U postgres -c "CREATE DATABASE smart_budget;"
```

### 2. Backend sozlang
```bash
cd backend
cp .env.example .env
# .env faylida DATABASE_URL ni o'zgartiring:
# DATABASE_URL="postgresql://postgres:PAROL@localhost:5432/smart_budget?schema=public"

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### 3. Frontend sozlang (yangi terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Brauzerda oching
```
http://localhost:5173
```

**Admin login:**
- Email: `admin@smartbudget.com`
- Parol: `Admin@123456`

---

## 📁 Loyiha tuzilmasi

```
smart-budget/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # 7 ta jadval
│   │   └── seed.js            # Default data
│   └── src/
│       ├── config/            # DB + konstantlar
│       ├── controllers/       # 10 ta controller
│       ├── middlewares/       # Auth, Error, Upload, Validate
│       ├── routes/            # 10 ta route fayl
│       ├── utils/             # JWT, AppError, apiResponse
│       ├── validators/        # Input validatsiyalar
│       ├── app.js             # Express app
│       └── server.js          # Entry point
│
└── frontend/
    └── src/
        ├── api/               # Axios + barcha service'lar
        ├── components/
        │   ├── layout/        # Sidebar, Topbar, MainLayout
        │   └── ui/            # 9 ta reusable komponent
        ├── contexts/          # AuthContext, ThemeContext
        ├── hooks/             # useQuery, useMutation
        ├── pages/
        │   ├── auth/          # Login, Register
        │   ├── dashboard/     # Dashboard + Charts
        │   ├── transactions/  # CRUD + Filter + Export
        │   ├── categories/    # CRUD + Icon/Color picker
        │   ├── budgets/       # Budget + Progress
        │   ├── savings/       # Goals + Contribution
        │   ├── reports/       # Charts + CSV/Excel export
        │   ├── notifications/ # Read/Delete
        │   ├── profile/       # Edit + Avatar + Password
        │   └── admin/         # Users + Analytics
        └── utils/             # format.js, helpers.js
```

---

## 🛠️ Tech Stack

### Backend
| | |
|--|--|
| Runtime | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| Security | Helmet, CORS, Rate Limiting, bcrypt |
| Upload | Multer |
| Export | xlsx (Excel + CSV) |

### Frontend
| | |
|--|--|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Router | React Router DOM v7 |
| HTTP | Axios |
| Notifications | React Hot Toast |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Kirish |
| GET | `/api/auth/me` | Profil ma'lumoti |
| GET | `/api/transactions` | Barcha tranzaksiyalar |
| POST | `/api/transactions` | Yangi tranzaksiya |
| GET | `/api/budgets` | Oylik budjetlar |
| GET | `/api/analytics/overview` | Grafiklar uchun ma'lumot |
| GET | `/api/reports/export/csv` | CSV yuklab olish |
| GET | `/api/admin/users` | (Admin) Foydalanuvchilar |

---

## ✨ Xususiyatlar

- ✅ JWT autentifikatsiya (access + refresh token)
- ✅ Daromad va xarajat kuzatuvi
- ✅ Oylik budjet va ogohlantirish
- ✅ Jamg'arma maqsadlari
- ✅ Moliyaviy grafik tahlillari (Line, Bar, Pie)
- ✅ CSV va Excel eksport
- ✅ Qorong'i/Kunduzgi rejim
- ✅ Responsive dizayn
- ✅ Admin panel
- ✅ Real-time xabarnomalar
