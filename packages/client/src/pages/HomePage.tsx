import React from 'react';
import { motion } from 'framer-motion';
import {
   ArrowRight,
   CheckCircle2,
   HeartPulse,
   Droplets,
   Dumbbell,
   Utensils,
   LineChart,
   Shield,
} from 'lucide-react';

const fadeUp = {
   hidden: { opacity: 0, y: 14 },
   show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
   hidden: {},
   show: { transition: { staggerChildren: 0.08 } },
};

export default function HomePage() {
   return (
      <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
         {/* Top glow */}
         <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-5xl rounded-full bg-gradient-to-r from-indigo-200/40 via-emerald-200/30 to-sky-200/40 blur-3xl" />

         {/* Hero */}
         <main className="relative">
            <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 md:pb-14 md:pt-16">
               <div className="grid items-center gap-10 md:grid-cols-2">
                  <motion.div
                     variants={stagger}
                     initial="hidden"
                     animate="show"
                  >
                     <motion.div
                        variants={fadeUp}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
                     >
                        <Shield className="h-4 w-4 text-emerald-600" />
                        Personalized plans • Local foods • Simple tracking
                     </motion.div>

                     <motion.h1
                        variants={fadeUp}
                        className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
                     >
                        Eat smarter with Sri Lankan meals.
                        <span className="block text-slate-600">
                           Track, plan, and improve one day at a time.
                        </span>
                     </motion.h1>

                     <motion.p
                        variants={fadeUp}
                        className="mt-4 max-w-xl text-base leading-relaxed text-slate-600"
                     >
                        NutriFit helps you set goals, generate meal plans, and
                        log meals, water, activity, and weight— with guidance
                        for common conditions like diabetes and BP.
                     </motion.p>

                     <motion.div
                        variants={fadeUp}
                        className="mt-6 flex flex-col gap-3 sm:flex-row"
                     >
                        {/*<a*/}
                        {/*   href="/onboarding"*/}
                        {/*   className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"*/}
                        {/*>*/}
                        {/*   Create my plan <ArrowRight className="h-4 w-4" />*/}
                        {/*</a>*/}
                        <a
                           href="/chat"
                           className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                           Ask NutriFit Assistant
                        </a>
                     </motion.div>

                     <motion.div
                        variants={fadeUp}
                        className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-3"
                     >
                        {[
                           'Meal plans (3 meals + 2 snacks)',
                           'Local food choices',
                           'Weekly summaries & charts',
                        ].map((t) => (
                           <div key={t} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                              <span>{t}</span>
                           </div>
                        ))}
                     </motion.div>
                  </motion.div>

                  {/* Hero card */}
                  <motion.div
                     initial={{ opacity: 0, y: 18 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, ease: 'easeOut' }}
                     className="relative"
                  >
                     <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-200/40 via-emerald-200/30 to-sky-200/40 blur-2xl" />
                     <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                           <div className="flex items-center justify-between">
                              <div>
                                 <div className="text-sm font-semibold">
                                    Today at a glance
                                 </div>
                                 <div className="text-xs text-slate-500">
                                    Simple, motivating progress
                                 </div>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                 On track
                              </span>
                           </div>
                        </div>

                        <div className="px-6 py-5">
                           <div className="grid gap-3">
                              <MiniStat
                                 icon={<Utensils className="h-4 w-4" />}
                                 label="Meals logged"
                                 value="2 / 5"
                              />
                              <MiniStat
                                 icon={<Droplets className="h-4 w-4" />}
                                 label="Water"
                                 value="5 / 8 glasses"
                              />
                              <MiniStat
                                 icon={<Dumbbell className="h-4 w-4" />}
                                 label="Activity"
                                 value="25 min"
                              />
                              <MiniStat
                                 icon={<LineChart className="h-4 w-4" />}
                                 label="Weight trend"
                                 value="↘ stable"
                              />
                           </div>

                           <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold text-slate-700">
                                 Suggested dinner
                              </div>
                              <div className="mt-1 text-sm font-semibold">
                                 Red rice + fish curry + gotukola sambol
                              </div>
                              <div className="mt-1 text-xs text-slate-600">
                                 Swap options: chicken ↔ fish, red rice ↔
                                 brown rice :contentReference
                              </div>
                           </div>

                           {/*<div className="mt-5 flex gap-2">*/}
                           {/*   <a*/}
                           {/*      href="/app/log"*/}
                           {/*      className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"*/}
                           {/*   >*/}
                           {/*      Log now*/}
                           {/*   </a>*/}
                           {/*   <a*/}
                           {/*      href="/app/plans"*/}
                           {/*      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"*/}
                           {/*   >*/}
                           {/*      View plan*/}
                           {/*   </a>*/}
                           {/*</div>*/}
                        </div>
                     </div>
                  </motion.div>
               </div>
            </section>

            {/* Features */}
            <section
               id="features"
               className="mx-auto max-w-6xl px-4 pb-12 md:pb-16"
            >
               <div className="flex items-end justify-between gap-4">
                  <div>
                     <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Everything you need, in one place
                     </h2>
                     <p className="mt-2 max-w-2xl text-slate-600">
                        Plans, tracking, and guidance tailored to your goal,
                        preference, and health needs.
                        :contentReference[oaicite:3]
                     </p>
                  </div>
                  <a
                     href="/onboarding"
                     className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 md:inline-flex"
                  >
                     Start in 2 minutes <ArrowRight className="h-4 w-4" />
                  </a>
               </div>

               <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <FeatureCard
                     icon={<Utensils className="h-5 w-5" />}
                     title="Sri Lankan meal plans"
                     desc="Practical plans with familiar foods: rice & curry, string hoppers, roti, mallum, and more."
                     pill="Local + doable"
                  />
                  <FeatureCard
                     icon={<LineChart className="h-5 w-5" />}
                     title="Track & see progress"
                     desc="Log meals, water, activity (MET-based), and weight. Get weekly summaries and trends."
                     pill="Simple insights"
                  />
                  <FeatureCard
                     icon={<HeartPulse className="h-5 w-5" />}
                     title="Condition-aware guidance"
                     desc="Friendly warnings + safer swaps for diabetes, BP/heart, kidney, thyroid, and gastritis/GERD."
                     pill="Safer choices"
                  />
               </div>
            </section>

            {/* How it works */}
            <section id="how" className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
               <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="grid gap-8 md:grid-cols-3">
                     <Step
                        n="01"
                        title="Tell us about you"
                        desc="Age, height, weight, activity level, goal, and food preference."
                     />
                     <Step
                        n="02"
                        title="Get targets & split"
                        desc="We set daily calories + meal split (3 meals + 2 snacks) to keep it easy."
                     />
                     <Step
                        n="03"
                        title="Follow, log, adjust"
                        desc="Track daily, see weekly trends, and tweak choices with the assistant."
                     />
                  </div>

                  <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl bg-slate-50 p-5 md:flex-row md:items-center">
                     <div>
                        <div className="text-sm font-semibold">
                           Ready to build your plan?
                        </div>
                        <div className="text-sm text-slate-600">
                           Start onboarding and get your first day plan
                           instantly.
                        </div>
                     </div>
                     <a
                        href="/onboarding"
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                     >
                        Start onboarding <ArrowRight className="h-4 w-4" />
                     </a>
                  </div>
               </div>
            </section>

            {/* Conditions */}
            <section
               id="conditions"
               className="mx-auto max-w-6xl px-4 pb-14 md:pb-20"
            >
               <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                     <h3 className="text-xl font-semibold tracking-tight">
                        Health-aware recommendations
                     </h3>
                     <p className="mt-2 text-slate-600">
                        NutriFit supports guidance for diabetes,
                        hypertension/BP/heart, thyroid, gastritis/GERD, and
                        kidney disease. :contentReference[oaicite:4]
                     </p>

                     <div className="mt-5 space-y-3 text-sm">
                        <Bullet
                           title="Diabetes"
                           text="Lower-carb friendly options, avoid high-sugar picks."
                        />
                        <Bullet
                           title="BP / Heart"
                           text="Prefer low-salt, low saturated fat choices."
                        />
                        <Bullet
                           title="Gastritis / GERD"
                           text="Gentle meals; avoid very spicy/acidic foods."
                        />
                     </div>

                     <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <span className="font-semibold">Note:</span> Guidance is
                        general nutrition support—not medical advice. For
                        serious conditions or medication questions, consult a
                        clinician. :contentReference[oaicite:5]
                     </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm md:p-8">
                     <h3 className="text-xl font-semibold tracking-tight">
                        Try the Assistant
                     </h3>
                     <p className="mt-2 text-slate-600">
                        Ask for meals, swaps, and logging help—built for Sri
                        Lankan users and local foods.
                        :contentReference[oaicite:6]
                     </p>

                     <div className="mt-5 space-y-3">
                        <PromptChip>
                           “Plan my meals for tomorrow (veg), weight loss.”
                        </PromptChip>
                        <PromptChip>
                           “Is kottu okay for diabetes? Suggest a safer option.”
                        </PromptChip>
                        <PromptChip>
                           “Log: 2 string hoppers + dhal + tea.”
                        </PromptChip>
                     </div>

                     <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <a
                           href="/chat"
                           className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                           Open chat <ArrowRight className="h-4 w-4" />
                        </a>
                        <a
                           href="/chat"
                           className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                           Help & Support
                        </a>
                     </div>
                  </div>
               </div>
            </section>
         </main>
      </div>
   );
}

function MiniStat({
   icon,
   label,
   value,
}: {
   icon: React.ReactNode;
   label: string;
   value: string;
}) {
   return (
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
         <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-800">
               {icon}
            </span>
            <span className="font-medium">{label}</span>
         </div>
         <div className="text-sm font-semibold text-slate-900">{value}</div>
      </div>
   );
}

function FeatureCard({
   icon,
   title,
   desc,
   pill,
}: {
   icon: React.ReactNode;
   title: string;
   desc: string;
   pill: string;
}) {
   return (
      <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
         <div className="flex items-start justify-between gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
               {icon}
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
               {pill}
            </span>
         </div>
         <div className="mt-4 text-lg font-semibold tracking-tight">
            {title}
         </div>
         <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
         <div className="mt-4 h-px w-full bg-slate-100" />
         <div className="mt-4 text-sm font-semibold text-slate-800">
            Explore{' '}
            <span className="inline-block transition group-hover:translate-x-0.5">
               →
            </span>
         </div>
      </div>
   );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
   return (
      <div>
         <div className="text-xs font-semibold text-slate-500">{n}</div>
         <div className="mt-2 text-base font-semibold">{title}</div>
         <div className="mt-2 text-sm leading-relaxed text-slate-600">
            {desc}
         </div>
      </div>
   );
}

function Bullet({ title, text }: { title: string; text: string }) {
   return (
      <div className="flex gap-2">
         <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
         <div>
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            <div className="text-sm text-slate-600">{text}</div>
         </div>
      </div>
   );
}

function PromptChip({ children }: { children: React.ReactNode }) {
   return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
         {children}
      </div>
   );
}
