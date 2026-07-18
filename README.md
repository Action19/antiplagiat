# Antiplagiat Platformasi

Matn originalligini tekshirish uchun to'liq funksional platforma.

## Xususiyatlari

- **4 ta plagiat aniqlash algoritmi:**
  - Shingling (n-gram solishtirish)
  - MinHash + LSH (tezkor o'xshashlik aniqlash)
  - TF-IDF + Cosine Similarity (semantik tahlil)
  - Fingerprinting / Rabin-Karp (aniq nusxa topish)

- **AI Text Detection** - AI tomonidan yozilgan matnni aniqlash
- **Fayl yuklash** - PDF, DOCX, TXT formatlarini qo'llab-quvvatlash
- **Internet tekshirish** - Web manbalar bilan solishtirish
- **PDF hisobot** - Natijalarni PDF formatida yuklab olish
- **Highlighting** - O'xshash qismlarni rang bilan ko'rsatish
- **Admin panel** - Foydalanuvchilar va hujjatlarni boshqarish

## Texnologiyalar

| Qism | Texnologiya |
|------|-------------|
| Backend | Node.js + Express |
| Frontend | React + Vite + Tailwind CSS |
| Database | PostgreSQL |
| Auth | JWT |
| File Parsing | pdf-parse, mammoth |
| PDF Report | PDFKit |

## O'rnatish

### Docker bilan (tavsiya etiladi)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

### Qo'lda o'rnatish

#### 1. PostgreSQL

```bash
createdb antiplagiat
```

#### 2. Backend

```bash
cd backend
cp .env.example .env
# .env faylda database sozlamalarini kiriting
npm install
npm run migrate  # Database jadvallarini yaratish
npm start        # Serverni ishga tushirish (port 5000)
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # Development server (port 3000)
```

## API Endpointlar

### Auth
- `POST /api/auth/register` - Ro'yxatdan o'tish
- `POST /api/auth/login` - Kirish
- `GET /api/auth/me` - Joriy foydalanuvchi
- `PUT /api/auth/profile` - Profil yangilash

### Documents
- `POST /api/documents/upload` - Fayl yuklash va tekshirish
- `POST /api/documents/check-text` - Matn tekshirish
- `GET /api/documents` - Hujjatlar ro'yxati
- `GET /api/documents/:id` - Bitta hujjat
- `GET /api/documents/:id/results` - Natijalar
- `GET /api/documents/:id/report` - PDF hisobot
- `DELETE /api/documents/:id` - O'chirish

### Admin
- `GET /api/admin/stats` - Statistika
- `GET /api/admin/users` - Foydalanuvchilar
- `PUT /api/admin/users/:id/toggle` - Bloklash/Ochish
- `DELETE /api/admin/users/:id` - O'chirish
- `GET /api/admin/documents` - Barcha hujjatlar

## Default Admin

```
Email: admin@antiplagiat.uz
Parol: admin123
```

## Loyiha strukturasi

```
antiplagiat/
├── backend/
│   ├── src/
│   │   ├── config/          - Database konfiguratsiya
│   │   ├── middleware/      - Auth, Upload, Security
│   │   ├── routes/          - API routelar
│   │   ├── services/
│   │   │   ├── algorithms/  - Plagiat algoritmlari
│   │   │   ├── ai-detection/ - AI aniqlash
│   │   │   ├── parser/      - Fayl parsing
│   │   │   ├── report/      - PDF hisobot
│   │   │   └── web-checker/ - Internet tekshirish
│   │   └── utils/           - Logger, Validator, Helpers
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/      - UI komponentlar
│       ├── context/         - Auth context
│       ├── pages/           - Sahifalar
│       └── services/        - API services
├── docker-compose.yml
└── README.md
```

## Litsenziya

MIT
