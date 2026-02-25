import express from 'express';
import z from 'zod';
import { DailyLog } from '../models/DailyLog';
import { Foods } from '../models/Foods'; // your food catalog model

const router = express.Router();

const VisionDetSchema = z.object({
   label: z.string(),
   confidence: z.number().min(0).max(1),
   portionEstimate: z.string().optional(), // e.g. "1 plate", "150 g"
});

const VisionPayloadSchema = z.object({
   userId: z.string().min(1),
   date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
   detections: z.array(VisionDetSchema).min(1),
});

async function mapDetectionsToEntries(dets: z.infer<typeof VisionDetSchema>[]) {
   // simple label->food match
   const labels = dets.map((d) => d.label);
   const foods = await Foods.find({ name: { $in: labels } }).lean(); // ensure your catalog names match YOLO labels
   const byName = new Map(foods.map((f: any) => [f.name, f]));

   return dets.map((d) => {
      const f = byName.get(d.label);
      if (f) {
         return {
            source: 'vision',
            time: new Date(),
            foodId: String(f._id),
            foodName: f.name,
            portion: d.portionEstimate || f.serving_size || '1 serving',
            calories: f.calories, // you can scale by portion if you estimate grams
            macros: {
               protein_g: f.protein_g,
               carbs_g: f.carbs_g,
               fat_g: f.fat_g,
            },
            raw: d,
         };
      }
      // fallback when unknown food
      return {
         source: 'vision',
         time: new Date(),
         foodName: d.label,
         portion: d.portionEstimate || 'unknown',
         calories: 0, // or an estimate
         macros: {},
         raw: d,
      };
   });
}

router.post('/api/logs/vision', async (req, res) => {
   const parsed = VisionPayloadSchema.safeParse(req.body);
   if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.flatten() });

   const { userId, date, detections } = parsed.data;
   const entries = await mapDetectionsToEntries(detections);

   const inc = entries.reduce(
      (acc, e: any) => {
         acc.cal += e.calories || 0;
         acc.p += e.macros?.protein_g || 0;
         acc.c += e.macros?.carbs_g || 0;
         acc.f += e.macros?.fat_g || 0;
         return acc;
      },
      { cal: 0, p: 0, c: 0, f: 0 }
   );

   const doc = await DailyLog.findOneAndUpdate(
      { userId, date },
      {
         $setOnInsert: {
            userId,
            date,
            entries: [],
            totalCalories: 0,
            totals: { protein_g: 0, carbs_g: 0, fat_g: 0 },
         },
         $push: { entries: { $each: entries } },
         $inc: {
            totalCalories: inc.cal,
            'totals.protein_g': inc.p,
            'totals.carbs_g': inc.c,
            'totals.fat_g': inc.f,
         },
      },
      { upsert: true, new: true }
   );

   res.json(doc);
});

export default router;
