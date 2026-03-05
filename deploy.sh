#!/bin/bash
cd /opt/akka-quizz
git pull origin main
docker compose build --no-cache
docker compose up -d
