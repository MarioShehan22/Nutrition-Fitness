# NutriFit — App Info (Sri Lanka)

Welcome to **NutriFit** — “Life Makes Healthy in Smart Sri Lanka”. This document lists the facts the assistant can rely on.

---

## Core Capabilities
- User profile: age, gender, height, weight, activity level (low/medium/high)
- Goals: weight loss / maintenance / gain
- Preferences: vegetarian / non-veg / vegan; allergies
- Health conditions (managed content): **diabetes, hypertension (BP)/heart, thyroid, gastritis/GERD, kidney disease**
- Trackers: **meals, water, activity (MET-based), weight**
- Weekly summaries, simple charts (calories in vs burn, macros, weight trend)

---

## Calculations & Defaults
- **Calories:** Mifflin–St Jeor (BMR) × activity factor (1.2 / 1.375 / 1.55), then goal adjustment (−500 kcal loss, +300 kcal gain; clamp 1200–3500 kcal).
- **Meal split:** Breakfast 25%, Lunch 30%, Dinner 25%, Snack 1 10%, Snack 2 10%.
- **Default macros (general):** 50% carbs / 20% protein / 30% fat.
- **Condition macro guidelines:**
  - **Diabetes:** 40% carbs / 25% protein / 35% fat.
  - **Heart/BP:** 45% carbs / 20% protein / 35% fat; prefer low-salt, low saturated fat.
  - **Kidney:** 50% carbs / 15% protein / 35% fat (lower protein), monitor potassium/phosphorus.
  - **Thyroid:** general macros; warn about goitrogens when relevant.
  - **Gastritis/GERD:** avoid very spicy/acidic/carbonated foods; encourage gentle options and timing.

> These are guidance defaults; users should consult a healthcare professional for personalized medical advice.

---

## Sri Lankan Food Database (examples)
The database includes local foods with per-serving calories and macros, e.g.:
- String hoppers with dhal, milk rice (kiribath), hoppers, pol roti, pittu, oats porridge
- Rice with chicken/fish/dhal/mallum, polos curry, red rice
- Kottu (veg/chicken), fried rice, string hopper biriyani
- Snacks: chickpeas, peanuts, curd with treacle, fruit bowl, tea, lime juice

Each item may carry tags such as **high_sugar, high_salt, deep_fried, diabetic_safe, heart_friendly, contains_milk, contains_nuts, very_spicy**.

---

## Suggestions & Warnings
- The assistant should always respect user allergies and preferences.
- If a chosen item conflicts with conditions, warn using **red/yellow/green** labels and suggest a safe alternative.
- Encourage **variety** (avoid repeating the same dish >2× per week).

---

## Reminders & Notifications
- Weekly weigh-in reminders and daily water/meal/activity prompts.
- Users can toggle reminders in Settings.

---

## Privacy & Data
- No sharing of personal identifiers in chat responses.
- Support users to view/export/delete their data through in-app settings (if available).

---

## Support
- For medical emergencies or prescription questions, advise contacting a healthcare professional.
- For app issues, direct users to in-app **Help & Support** or the official email shown in Settings.

Have a healthy day with **NutriFit**!
