#!/bin/bash

echo "🔴 Parando processos antigos..."
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "node.*next" 2>/dev/null
sleep 2

echo "🧹 Limpando cache..."
rm -rf .next

echo "📦 Instalando dependências..."
npm install

echo "🚀 Iniciando servidor Next.js..."
npm run dev
