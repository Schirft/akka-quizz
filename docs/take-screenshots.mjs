import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5173';

const SUPABASE_URL = 'https://tpkeqwmbjjycgmrwtidc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa2Vxd21iamp5Y2dtcnd0aWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNTk5NTYsImV4cCI6MjA1MzgzNTk1Nn0.SE3OEsMqRbEfV1LUSW3sZHKEkXQ7oGHGef1jDAbiYBM';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshot(page, name, waitMs = 2000) {
  await sleep(waitMs);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function scrollScreenshot(page, name, waitMs = 1500) {
  await sleep(waitMs);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  console.log(`  📸 ${name}.png (full page)`);
}

async function loginViaSupabase(page, email, password) {
  // Inject supabase auth directly
  await page.evaluate(async ({url, key, email, password}) => {
    // Use fetch to get auth token from Supabase
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.access_token) {
      // Store in localStorage the way supabase-js expects
      const storageKey = `sb-tpkeqwmbjjycgmrwtidc-auth-token`;
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: 'bearer',
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        user: data.user,
      };
      localStorage.setItem(storageKey, JSON.stringify(session));
      console.log('Auth stored for', email);
      return true;
    } else {
      console.error('Auth failed:', JSON.stringify(data));
      return false;
    }
  }, {url: SUPABASE_URL, key: SUPABASE_ANON_KEY, email, password});
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PART 1: PUBLIC / LOGIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n━━ 1. LOGIN PAGE ━━');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await screenshot(page, '01_login');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PART 2: DEMO USER PAGES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n━━ 2. DEMO USER ━━');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await loginViaSupabase(page, 'demo@akka.app', 'demo123');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await screenshot(page, '02_home_dashboard', 2500);

  // Scroll down to see ranking section
  await page.evaluate(() => window.scrollBy(0, 600));
  await screenshot(page, '02b_home_scrolled', 1000);

  console.log('  News feed...');
  await page.goto(`${BASE}/news`, { waitUntil: 'networkidle2' });
  await screenshot(page, '05_news_feed', 3000);

  console.log('  Leaderboard...');
  await page.goto(`${BASE}/leaderboard`, { waitUntil: 'networkidle2' });
  await screenshot(page, '06_leaderboard', 2500);

  console.log('  Profile...');
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle2' });
  await screenshot(page, '07_profile', 2500);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PART 3: QUIZ FLOW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n━━ 3. QUIZ FLOW ━━');
  await page.goto(`${BASE}/quiz`, { waitUntil: 'networkidle2' });
  await screenshot(page, '03a_quiz_start', 2500);

  // Click Start Quiz
  try {
    const startBtn = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('button')];
      return btns.find(b => b.textContent.includes('Start'));
    });
    if (startBtn) {
      await startBtn.click();
      await sleep(3000);
      await screenshot(page, '03b_quiz_question');

      // Try answering a question
      const optionBtns = await page.$$('[class*="option"], [class*="answer"], [class*="choice"], button[class*="btn"]');
      if (optionBtns.length >= 2) {
        await optionBtns[1].click();
        await sleep(2000);
        await screenshot(page, '03c_quiz_feedback');

        // Click next/continue
        const nextBtn = await page.evaluateHandle(() => {
          const btns = [...document.querySelectorAll('button')];
          return btns.find(b => b.textContent.toLowerCase().includes('next') || b.textContent.toLowerCase().includes('continue'));
        });
        if (nextBtn) {
          await nextBtn.click();
          await sleep(2000);
          await screenshot(page, '03d_quiz_q2');
        }
      }
    }
  } catch (e) {
    console.log('  Quiz interaction error:', e.message);
  }

  // Puzzle page (direct nav)
  console.log('  Puzzle page...');
  await page.goto(`${BASE}/puzzle`, { waitUntil: 'networkidle2' });
  await screenshot(page, '03e_puzzle', 2500);

  // Lesson page
  console.log('  Lesson page...');
  await page.goto(`${BASE}/lesson`, { waitUntil: 'networkidle2' });
  await screenshot(page, '03f_lesson', 2500);

  // Results page
  console.log('  Results page...');
  await page.goto(`${BASE}/results`, { waitUntil: 'networkidle2' });
  await screenshot(page, '04_results', 2500);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PART 4: ADMIN PAGES (login as admin)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n━━ 4. ADMIN PAGES ━━');
  // Clear and re-login as admin
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await loginViaSupabase(page, 'hd@akka.app', 'test123');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await screenshot(page, '08_admin_dashboard', 3000);

  console.log('  Admin Generator...');
  await page.goto(`${BASE}/admin/generate`, { waitUntil: 'networkidle2' });
  await screenshot(page, '09_admin_generator', 2500);

  console.log('  Admin Questions...');
  await page.goto(`${BASE}/admin/questions`, { waitUntil: 'networkidle2' });
  await screenshot(page, '10_admin_questions', 2500);

  console.log('  Admin Calendar...');
  await page.goto(`${BASE}/admin/calendar`, { waitUntil: 'networkidle2' });
  await screenshot(page, '11_admin_calendar', 2500);

  console.log('  Admin News...');
  await page.goto(`${BASE}/admin/news`, { waitUntil: 'networkidle2' });
  await screenshot(page, '12_admin_news', 2500);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PART 5: PROGRESSION PATH MODAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n━━ 5. PROGRESSION PATH ━━');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await loginViaSupabase(page, 'demo@akka.app', 'demo123');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Click on the level badge/progress bar to open path modal
  try {
    const levelBtn = await page.evaluateHandle(() => {
      const els = [...document.querySelectorAll('*')];
      return els.find(el => {
        const text = el.textContent || '';
        const cls = el.className || '';
        return (text.includes('Angel') && text.includes('Level') && el.tagName !== 'HTML' && el.tagName !== 'BODY') ||
               cls.includes('level') || cls.includes('progress-path') || cls.includes('progression');
      });
    });
    if (levelBtn) {
      await levelBtn.click();
      await sleep(1500);
      await screenshot(page, '13_progression_path');
    }
  } catch (e) {
    console.log('  Progression modal not found, trying alternate click...');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n✅ ALL DONE');
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Total: ${files.length} screenshots`);
  files.forEach(f => console.log(`  ${f}`));

  await browser.close();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
