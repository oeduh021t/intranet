#!/bin/bash

echo "------------------------------------------"
echo "🚀 INTRANET: Automação de Git"
echo "------------------------------------------"

# Pergunta o que foi feito
read -p "📝 O que foi feito neste commit? " mensagem

# Executa os comandos do Git
git add .
git commit -m "$mensagem"

# Sobe para o GitHub usando o remote já configurado na máquina
echo "📤 Subindo para o GitHub..."
git push origin main

echo "------------------------------------------"
echo "✅ Processo concluído."
echo "------------------------------------------"