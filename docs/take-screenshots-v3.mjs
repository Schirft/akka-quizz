import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';
import path from 'path';

const BASE = 'http://localhost:5174';
const DIR = '/Users/hd/Desktop/Akka/docs/screenshots';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,       // Use headed mode so we can see what's happening
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
    args: ['--window-size=420,900']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // Helper: take screenshot
  const snap = async (name) => {
    const fp = path.join(DIR, name);
    await page.screenshot({ path: fp, fullPage: false });
    console.log(`✅ ${name}`);
  };

  // Helper: wait for network idle
  const waitIdle = async (ms = 2000) => {
    try { await page.waitForNetworkIdle({ idleTime: 500, timeout: ms }); } catch {}
  };

  // Helper: check if we're on login page
  const isOnLogin = async () => {
    try {
      const url = page.url();
      if (url.includes('/login')) return true;
      const loginBtn = await page.$('button:has-text("Try Demo"), [data-testid="try-demo"]');
      return !!loginBtn;
    } catch { return false; }
  };

  // Helper: click Try Demo and wait for auth
  const doLogin = async () => {
    console.log('🔑 Logging in via Try Demo...');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
    await setTimeout(1500);

    // Find and click Try Demo button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tryDemo = buttons.find(b =>
        b.textContent.toLowerCase().includes('try demo') ||
        b.textContent.toLowerCase().includes('demo') ||
        b.textContent.toLowerCase().includes('essayer')
      );
      if (tryDemo) { tryDemo.click(); return true; }
      return false;
    });

    if (!clicked) {
      console.log('⚠️  Could not find Try Demo button, trying password login...');
      // Try direct Supabase auth
      await page.evaluate(async () => {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const sb = createClient(
          'https://tpkeqwmbjjycgmrwtidc.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa2Vxd21iamp5Y2dtcnd0aWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NTI2OTIsImV4cCI6MjA2MzQyODY5Mn0.6kBpg_MJPJPFOKcftBfyFdxPxPB3N9j4Y1R32dGnFuo'
        );
        await sb.auth.signInWithPassword({ email: 'demo@akka.app', password: 'demo123456' });
      });
    }

    console.log('⏳ Waiting 4s for auth propagation...');
    await setTimeout(4000);
    await waitIdle(3000);
  };

  // Helper: ensure we're still logged in
  const ensureAuth = async () => {
    const url = page.url();
    if (url.includes('/login')) {
      console.log('🔄 Auth lost, re-logging in...');
      await doLogin();
      return false; // indicates we had to re-login
    }
    return true; // still authenticated
  };

  // Helper: navigate and verify not redirected to login
  const goTo = async (path, waitMs = 2000) => {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await setTimeout(waitMs);
    await waitIdle(2000);
    const ok = await ensureAuth();
    if (!ok) {
      // Re-navigate after re-login
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      await setTimeout(waitMs);
      await waitIdle(2000);
    }
  };

  try {
    // ========== 01. LOGIN PAGE ==========
    console.log('\n📸 01. Login page');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
    await setTimeout(2000);
    await snap('01_login.png');

    // ========== LOGIN VIA TRY DEMO ==========
    await doLogin();

    // ========== 02. HOME DASHBOARD ==========
    console.log('\n📸 02. Home Dashboard');
    // After login should be on home already
    const currentUrl = page.url();
    if (!currentUrl.endsWith('/') && !currentUrl.includes('/?')) {
      await goTo('/');
    }
    await setTimeout(2000);
    await snap('02_home_dashboard.png');

    // ========== 02b. HOME SCROLLED ==========
    console.log('\n📸 02b. Home scrolled');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await setTimeout(1000);
    await snap('02b_home_scrolled.png');
    await page.evaluate(() => window.scrollTo(0, 0));

    // ========== 03a. QUIZ START ==========
    console.log('\n📸 03a. Quiz start');
    await goTo('/quiz');
    await snap('03a_quiz_start.png');

    // ========== 03b. QUIZ QUESTION — click start button ==========
    console.log('\n📸 03b. Quiz question');
    // Look for a start/play button
    const startClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => {
        const text = b.textContent.toLowerCase();
        return text.includes('start') || text.includes('play') || text.includes('begin') ||
               text.includes('commencer') || text.includes('lancer') || text.includes("let's go") ||
               text.includes("daily challenge") || text.includes("démarrer");
      });
      if (startBtn) { startBtn.click(); return startBtn.textContent.trim(); }
      return null;
    });
    console.log(`   Start button: ${startClicked || 'not found'}`);
    await setTimeout(3000);
    await waitIdle(2000);
    await snap('03b_quiz_question.png');

    // ========== 03c. QUIZ FEEDBACK — click an answer ==========
    console.log('\n📸 03c. Quiz feedback');
    const answerClicked = await page.evaluate(() => {
      // Look for answer option buttons/cards
      const options = document.querySelectorAll('[class*="option"], [class*="answer"], [class*="choice"], [role="button"]');
      if (options.length >= 2) {
        options[0].click();
        return `Clicked first of ${options.length} options`;
      }
      // Try any button that looks like an answer
      const buttons = Array.from(document.querySelectorAll('button'));
      const answerBtn = buttons.find(b => {
        const text = b.textContent.trim();
        return text.length > 5 && text.length < 200 && !text.toLowerCase().includes('next') && !text.toLowerCase().includes('skip');
      });
      if (answerBtn) { answerBtn.click(); return answerBtn.textContent.trim().substring(0, 50); }
      return null;
    });
    console.log(`   Answer: ${answerClicked || 'none found'}`);
    await setTimeout(2000);
    await snap('03c_quiz_feedback.png');

    // ========== CONTINUE THROUGH QUIZ — answer remaining questions ==========
    console.log('\n⏩ Answering remaining questions...');
    for (let q = 2; q <= 3; q++) {
      // Click "Next" or "Continue" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(b => {
          const text = b.textContent.toLowerCase();
          return text.includes('next') || text.includes('continue') || text.includes('suivant') || text.includes('continuer');
        });
        if (nextBtn) nextBtn.click();
      });
      await setTimeout(2000);

      // Click an answer
      await page.evaluate(() => {
        const options = document.querySelectorAll('[class*="option"], [class*="answer"], [class*="choice"], [role="button"]');
        if (options.length >= 2) { options[0].click(); return; }
        const buttons = Array.from(document.querySelectorAll('button'));
        const answerBtn = buttons.find(b => {
          const text = b.textContent.trim();
          return text.length > 5 && text.length < 200 && !text.toLowerCase().includes('next');
        });
        if (answerBtn) answerBtn.click();
      });
      await setTimeout(2000);
      console.log(`   Q${q} answered`);

      // Click next after feedback
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(b => {
          const text = b.textContent.toLowerCase();
          return text.includes('next') || text.includes('continue') || text.includes('suivant');
        });
        if (nextBtn) nextBtn.click();
      });
      await setTimeout(2000);
    }

    // ========== 03e. PUZZLE ==========
    console.log('\n📸 03e. Puzzle');
    await setTimeout(2000);
    await snap('03e_puzzle.png');

    // Try to complete the puzzle (tap on something)
    await page.evaluate(() => {
      // Look for tappable rows or cells
      const tappable = document.querySelectorAll('[class*="row"], [class*="cell"], [class*="item"], [class*="card"]');
      if (tappable.length > 0) {
        // Click a row in the middle
        const idx = Math.floor(tappable.length / 2);
        tappable[idx].click();
      }
    });
    await setTimeout(1500);

    // Click confirm/submit if available
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => {
        const text = b.textContent.toLowerCase();
        return text.includes('confirm') || text.includes('submit') || text.includes('check') || text.includes('valider');
      });
      if (confirmBtn) confirmBtn.click();
    });
    await setTimeout(2000);

    // Click next/continue to go to lesson
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => {
        const text = b.textContent.toLowerCase();
        return text.includes('next') || text.includes('continue') || text.includes('lesson') || text.includes('suivant');
      });
      if (nextBtn) nextBtn.click();
    });
    await setTimeout(3000);

    // ========== 03f. LESSON ==========
    console.log('\n📸 03f. Lesson');
    await snap('03f_lesson.png');

    // Click finish/complete
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const finishBtn = buttons.find(b => {
        const text = b.textContent.toLowerCase();
        return text.includes('finish') || text.includes('complete') || text.includes('done') ||
               text.includes('results') || text.includes('terminer') || text.includes('voir');
      });
      if (finishBtn) finishBtn.click();
    });
    await setTimeout(3000);

    // ========== 04. RESULTS ==========
    console.log('\n📸 04. Results');
    await snap('04_results.png');

    // Go back to home after results
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const homeBtn = buttons.find(b => {
        const text = b.textContent.toLowerCase();
        return text.includes('home') || text.includes('back') || text.includes('accueil') || text.includes('retour');
      });
      if (homeBtn) homeBtn.click();
    });
    await setTimeout(2000);

    // ========== 05. NEWS FEED ==========
    console.log('\n📸 05. News feed');
    await goTo('/news');
    await ensureAuth();
    await snap('05_news_feed.png');

    // ========== 06. LEADERBOARD ==========
    console.log('\n📸 06. Leaderboard');
    await goTo('/leaderboard');
    await ensureAuth();
    await snap('06_leaderboard.png');

    // ========== 07. PROFILE ==========
    console.log('\n📸 07. Profile');
    await goTo('/profile');
    await ensureAuth();
    await snap('07_profile.png');

    // ========== ADMIN SIDE ==========
    // Try navigating to admin — demo user should have is_admin=true
    console.log('\n📸 08. Admin Dashboard');
    await goTo('/admin', 3000);

    // Check if we're blocked (not admin)
    const onAdmin = page.url().includes('/admin');
    if (!onAdmin) {
      console.log('⚠️  Not reaching admin, trying console auth...');
      await page.evaluate(async () => {
        if (window.__supabase) {
          await window.__supabase.auth.signInWithPassword({email: 'demo@akka.app', password: 'demo123456'});
        }
      });
      await setTimeout(2000);
      await goTo('/admin', 3000);
    }
    await snap('08_admin_dashboard.png');

    console.log('\n📸 09. Admin Generator');
    await goTo('/admin/generate', 3000);
    await snap('09_admin_generator.png');

    console.log('\n📸 10. Admin Questions');
    await goTo('/admin/questions', 3000);
    await snap('10_admin_questions.png');

    console.log('\n📸 11. Admin Calendar');
    await goTo('/admin/daily', 3000);
    await snap('11_admin_calendar.png');

    console.log('\n📸 12. Admin News');
    await goTo('/admin/news', 3000);
    await snap('12_admin_news.png');

    console.log('\n🎉 All screenshots complete!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    // Take error screenshot
    await page.screenshot({ path: path.join(DIR, 'ERROR.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
