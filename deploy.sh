#!/bin/bash
cd /opt/akka-quizz
git pull origin main
docker compose up -d --build
