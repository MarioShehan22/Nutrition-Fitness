import { DailyLog } from '../models/DailyLog';
import { Foods } from '../models/Foods.ts';

type VisionDetection = {
   label: string;
   confidence: number;
   portionEstimate?: string;
};

type VisionPayload = {
   userId: string;
   date: string;
   detections: VisionDetection[];
};

type FoodLean = {
   _id: unknown;
   name: string;
   serving_size?: string;
   calories?: number;
   protein_g?: number;
   carbs_g?: number;
   fat_g?: number;
};

type VisionEntry = {
   source: 'vision';
   time: Date;
   foodId?: string;
   foodName: string;
   portion: string;
   calories: number;
   macros: {
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
   };
   raw: VisionDetection;
};

async function mapDetectionsToEntries(
   dets: VisionDetection[]
): Promise<VisionEntry[]> {
   const labels = dets.map((d) => d.label);

   const foods = (await Foods.find({
      name: { $in: labels },
   }).lean()) as FoodLean[];

   const byName = new Map<string, FoodLean>(
      foods.map((f) => [f.name, f] as const)
   );

   return dets.map((d) => {
      const f = byName.get(d.label);

      if (f) {
         return {
            source: 'vision',
            time: new Date(),
            foodId: String(f._id),
            foodName: f.name,
            portion: d.portionEstimate || f.serving_size || '1 serving',
            calories: Number(f.calories ?? 0),
            macros: {
               protein_g: Number(f.protein_g ?? 0),
               carbs_g: Number(f.carbs_g ?? 0),
               fat_g: Number(f.fat_g ?? 0),
            },
            raw: d,
         };
      }

      return {
         source: 'vision',
         time: new Date(),
         foodName: d.label,
         portion: d.portionEstimate || 'unknown',
         calories: 0,
         macros: {},
         raw: d,
      };
   });
}

async function createVisionLog(payload: VisionPayload) {
   const { userId, date, detections } = payload;

   const entries = await mapDetectionsToEntries(detections);

   const inc = entries.reduce(
      (acc, e) => {
         acc.cal += Number(e.calories || 0);
         acc.p += Number(e.macros?.protein_g || 0);
         acc.c += Number(e.macros?.carbs_g || 0);
         acc.f += Number(e.macros?.fat_g || 0);
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

   if (!doc) {
      throw new Error('Failed to create vision log');
   }

   return doc;
}

export const logsVisionService = {
   createVisionLog,
   mapDetectionsToEntries,
};

export default logsVisionService;
