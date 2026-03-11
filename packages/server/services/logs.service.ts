import { DailyLog } from '../models/DailyLog';

type LogMacros = {
   protein_g?: number;
   carbs_g?: number;
   fat_g?: number;
};

type ManualLogEntryInput = {
   time?: Date;
   foodId?: string;
   foodName: string;
   portion?: string;
   calories: number;
   macros?: LogMacros;
};

type ManualLogInput = {
   userId: string;
   date: string;
   entries: ManualLogEntryInput[];
};

type DailyLogEntry = {
   source: 'manual';
   time: Date;
   foodId?: string;
   foodName: string;
   portion?: string;
   calories: number;
   macros?: LogMacros;
};

type DailyLogUpdate = {
   $setOnInsert: {
      userId: string;
      date: string;
   };
   $push: {
      entries: {
         $each: DailyLogEntry[];
      };
   };
   $inc: {
      totalCalories: number;
      'totals.protein_g': number;
      'totals.carbs_g': number;
      'totals.fat_g': number;
   };
};

async function addManualLog(input: ManualLogInput) {
   const { userId, date, entries } = input;

   const update = entries.reduce<DailyLogUpdate>(
      (acc, e) => {
         acc.$push.entries.$each.push({
            source: 'manual',
            time: e.time ?? new Date(),
            foodId: e.foodId,
            foodName: e.foodName,
            portion: e.portion,
            calories: e.calories,
            macros: e.macros,
         });

         acc.$inc.totalCalories += e.calories;

         if (e.macros) {
            acc.$inc['totals.protein_g'] += e.macros.protein_g ?? 0;
            acc.$inc['totals.carbs_g'] += e.macros.carbs_g ?? 0;
            acc.$inc['totals.fat_g'] += e.macros.fat_g ?? 0;
         }

         return acc;
      },
      {
         $setOnInsert: {
            userId,
            date,
         },
         $push: {
            entries: { $each: [] },
         },
         $inc: {
            totalCalories: 0,
            'totals.protein_g': 0,
            'totals.carbs_g': 0,
            'totals.fat_g': 0,
         },
      }
   );

   const doc = await DailyLog.findOneAndUpdate({ userId, date }, update, {
      upsert: true,
      new: true,
   });

   if (!doc) {
      throw new Error('Failed to save manual log');
   }

   return doc;
}

export const logsService = {
   addManualLog,
};

export default logsService;
