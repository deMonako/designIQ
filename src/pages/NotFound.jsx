import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Home, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-3xl mb-8">
          <Search className="w-12 h-12 text-orange-600" />
        </div>

        <h1 className="text-8xl font-black text-orange-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Strona nie istnieje
        </h2>
        <p className="text-slate-600 mb-10">
          Strona, której szukasz, nie została znaleziona. Mogła zostać przeniesiona lub usunięta.
        </p>

        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-xl hover:shadow-orange-500/30 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300"
        >
          <Home className="w-5 h-5" />
          Wróć do strony głównej
        </Link>
      </motion.div>
    </div>
  );
}
