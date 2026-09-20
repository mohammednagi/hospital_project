import { test, expect } from "@playwright/test";

test.describe("SmartGov Hospital End-to-End Core Flows", () => {
  test("1. Patient Login & Booking Flow -> Receives Ticket or Joins Waitlist", async ({ page }) => {
    // 1. Visit Login
    await page.goto("/ar/login");
    await page.waitForSelector("button", { state: "visible" });

    // 2. Click Patient Quick Fill
    const patientQuickFill = page.locator('button:has-text("29501010101234")');
    if (await patientQuickFill.isVisible()) {
      await patientQuickFill.click();
    } else {
      await page.fill('input[type="text"]', "29501010101234");
      await page.fill('input[type="password"]', "GovEgypt@2026");
    }

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 3. Start booking flow
    await page.goto("/ar/book");
    await page.waitForSelector("h1", { state: "visible" });

    // Click a common symptom chip or type symptom
    const symptomChip = page.locator("button").filter({ hasText: /ألم بالصدر|صداع|ألم بالبطن/ }).first();
    if (await symptomChip.isVisible()) {
      await symptomChip.click();
      await page.waitForTimeout(1000);
    } else {
      await page.fill('textarea, input[placeholder*="أعراض"]', "أعاني من ألم بالصدر وضيق تنفس");
      await page.waitForTimeout(1000);
    }

    // Select suggested specialty card
    const specialtyBtn = page.locator("button").filter({ hasText: /قلب|باطنة|أطفال|عيون|تخصص/ }).first();
    await expect(specialtyBtn).toBeVisible({ timeout: 10000 });
    await specialtyBtn.click();

    // Step 2: Hospital Selection
    await page.waitForURL(/\/ar\/book\/hospital/, { timeout: 10000 });
    const selectHospitalBtn = page.locator("button").filter({ hasText: /اختيار المستشفى/ }).first();
    await expect(selectHospitalBtn).toBeVisible({ timeout: 10000 });
    await selectHospitalBtn.click();

    // Step 3: Slot Selection or Waitlist
    await page.waitForURL(/\/ar\/book\/slot/, { timeout: 10000 });
    const slotActionBtn = page.locator('button:has-text("اختيار هذا الموعد"), button:has-text("الانضمام لقائمة الانتظار الذكية"), button:has-text("عرض جدول المواعيد بالكامل")').first();
    await expect(slotActionBtn).toBeVisible({ timeout: 10000 });
    await slotActionBtn.click();

    // Step 4: If routed to Confirmation, confirm ticket
    if (page.url().includes("/book/confirm")) {
      const confirmBtn = page.locator("button").filter({ hasText: /تأكيد الحجز/ }).first();
      await expect(confirmBtn).toBeVisible({ timeout: 10000 });
      await confirmBtn.click();

      // Step 5: Digital Ticket
      await page.waitForURL(/\/ar\/appointments\/.*\/ticket/, { timeout: 15000 });
      await expect(page.locator("body")).toContainText(/تذكرة|TKT-|رقم/);
    } else {
      // If joined waitlist or on calendar
      await expect(page.locator("body")).toContainText(/قائمة الانتظار|تم تسجيلك|المواعيد المتاحة/);
    }
  });

  test("2. Reception Kanban Board & Check-in Flow", async ({ page }) => {
    // 1. Visit Login as Reception
    await page.goto("/ar/login");
    await page.waitForSelector("button", { state: "visible" });

    // Quick Fill Reception
    const receptionQuickFill = page.locator('button:has-text("28805050105678")');
    if (await receptionQuickFill.isVisible()) {
      await receptionQuickFill.click();
    } else {
      await page.fill('input[type="text"]', "28805050105678");
      await page.fill('input[type="password"]', "GovEgypt@2026");
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 2. Navigate to Reception Board
    await page.goto("/ar/reception/board");
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("body")).toContainText(/شاشة الاستقبال|طابور العيادات/);

    // 3. Verify Board contains actual Kanban columns
    await expect(page.locator("body")).toContainText(/محجوز|حاضر بالعيادة|جاري الكشف|تم الكشف/);
  });

  test("3. Doctor Workspace & Queue Consultation Flow", async ({ page }) => {
    // 1. Visit Login as Doctor
    await page.goto("/ar/login");
    await page.waitForSelector("button", { state: "visible" });

    // Quick Fill Doctor
    const doctorQuickFill = page.locator('button:has-text("28003030109012")');
    if (await doctorQuickFill.isVisible()) {
      await doctorQuickFill.click();
    } else {
      await page.fill('input[type="text"]', "28003030109012");
      await page.fill('input[type="password"]', "GovEgypt@2026");
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // 2. Navigate to Doctor Queue
    await page.goto("/ar/doctor/queue");
    await page.waitForSelector("h1", { timeout: 15000 });
    await expect(page.locator("body")).toContainText(/عيادة الطبيب|طابور الكشف/);

    // 3. Test call-next button if available
    const callNextBtn = page.locator("button").filter({ hasText: /نداء على المريض التالي/ }).first();
    if (await callNextBtn.isVisible()) {
      if (await callNextBtn.isEnabled()) {
        await callNextBtn.click();
        await page.waitForTimeout(1500);

        // Enter clinical note
        const noteArea = page.locator("textarea");
        if (await noteArea.isVisible()) {
          await noteArea.fill("الكشف سليم، تم قياس الضغط ووصف العلاج المناسب.");
          const completeBtn = page.locator("button").filter({ hasText: /إتمام الكشف/ }).first();
          if (await completeBtn.isVisible()) {
            await completeBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test("4. Bilingual & RTL/LTR Viewport Audit", async ({ page }) => {
    // Check Arabic RTL
    await page.goto("/ar/login");
    const htmlAr = page.locator("html");
    await expect(htmlAr).toHaveAttribute("dir", "rtl");
    await expect(htmlAr).toHaveAttribute("lang", "ar");
    await expect(page.locator("h1")).toContainText(/تسجيل الدخول/);

    // Check English LTR
    await page.goto("/en/login");
    const htmlEn = page.locator("html");
    await expect(htmlEn).toHaveAttribute("dir", "ltr");
    await expect(htmlEn).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toContainText(/Government Portal Login|Sign In/i);
  });
});
