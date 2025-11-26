import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    imie_nazwisko: "",
    email: "",
    telefon: "",
    temat: "",
    wiadomosc: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tutaj będzie integracja z Twoim systemem formularzy
    console.log("Dane formularza:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">Imię i nazwisko *</Label>
        <Input
          id="name"
          value={formData.imie_nazwisko}
          onChange={(e) => setFormData({ ...formData, imie_nazwisko: e.target.value })}
          required
          disabled={isSubmitting}
          placeholder="Jan Kowalski"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isSubmitting}
          placeholder="jan@example.com"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base">Telefon</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.telefon}
          onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
          disabled={isSubmitting}
          placeholder="+48 123 456 789"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-base">Temat</Label>
        <Input
          id="subject"
          value={formData.temat}
          onChange={(e) => setFormData({ ...formData, temat: e.target.value })}
          disabled={isSubmitting}
          placeholder="W czym możemy pomóc?"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2 flex-grow flex flex-col">
        <Label htmlFor="message" className="text-base">Wiadomość *</Label>
        <textarea
          id="message"
          value={formData.wiadomosc}
          onChange={(e) => setFormData({ ...formData, wiadomosc: e.target.value })}
          required
          disabled={isSubmitting}
          placeholder="Opisz swoje potrzeby..."
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base flex-grow resize-none"
          style={{ minHeight: '150px' }}
        />
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:shadow-2xl hover:shadow-orange-500/50 text-lg py-6 rounded-xl mt-auto disabled:opacity-50"
        >
          <Send className="w-5 h-5 mr-2" />
          Wyślij wiadomość
        </Button>
      </motion.div>
    </form>
  );
}