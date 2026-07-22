#!/bin/bash
# Smart Budget — Quick Start Script
# Ishlatish: ./start.sh

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Smart Budget — Starting        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Backend .env tekshiruvi
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  backend/.env topilmadi. Yaratilmoqda...${NC}"
  cp backend/.env.example backend/.env
  echo -e "${RED}❗ backend/.env faylida DATABASE_URL ni to'ldiring, keyin qayta ishga tushiring!${NC}"
  exit 1
fi

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}📦 Backend dependencies o'rnatilmoqda...${NC}"
  cd backend && npm install && cd ..
fi

# Frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}📦 Frontend dependencies o'rnatilmoqda...${NC}"
  cd frontend && npm install && cd ..
fi

echo -e "${GREEN}🚀 Backend ishga tushirilmoqda (port 5000)...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

sleep 2

echo -e "${GREEN}🎨 Frontend ishga tushirilmoqda (port 5173)...${NC}"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Ikkala server ham ishlamoqda!${NC}"
echo -e "   📡 Backend:  ${BLUE}http://localhost:5000/api${NC}"
echo -e "   🌐 Frontend: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "   👤 Admin: admin@smartbudget.com / Admin@123456"
echo ""
echo -e "${YELLOW}To'xtatish uchun: Ctrl+C${NC}"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Servers stopped.'" INT
wait
