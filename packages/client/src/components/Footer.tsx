const Footer = () => {
   return (
      <footer id="footer" className="border-t border-slate-200 bg-white">
         <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
               <div>
                  <div className="text-sm font-semibold">NutriFit</div>
                  <div className="mt-1 text-sm text-slate-600">
                     Life Makes Healthy in Smart Sri Lanka
                  </div>
               </div>
               <div className="flex flex-wrap gap-3 text-sm">
                  <a
                     className="rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                     href="/privacy"
                  >
                     Privacy
                  </a>
                  <a
                     className="rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                     href="/terms"
                  >
                     Terms
                  </a>
                  <a
                     className="rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                     href="/app/help"
                  >
                     Support
                  </a>
               </div>
            </div>

            <div className="mt-8 text-xs text-slate-500">
               © {new Date().getFullYear()} NutriFit. All rights reserved.
            </div>
         </div>
      </footer>
   );
};

export default Footer;
