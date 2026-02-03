import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Upload, FileText, Image, Download, Loader2, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzaygYUtnj50uxOWsMCqIH0EvjlheXka59q96r6fvikZ4ESVZvOtyDwvzCjrg5x7QZbmw/exec";

export default function FileUploadSection({ investment, onFileUploaded, isReadOnly }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- LOGIKA FILTROWANIA DOKUMENTÓW ---
  // Definiujemy listy przed renderowaniem
  const allDocs = investment?.documents || [];
  
  const clientDocuments = allDocs.filter(
    (doc) => doc.uploaded_by === "Klient" || doc.uploaded_by === investment?.client_name
  );
  
  const contractorDocuments = allDocs.filter(
    (doc) => doc.uploaded_by !== "Klient" && doc.uploaded_by !== investment?.client_name
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Plik jest za duży. Maksymalny rozmiar to 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Wybierz plik");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const response = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify({
            investment_code: investment.investment_code,
            author: "Klient",
            name: selectedFile.name,
            type: selectedFile.type,
            fileData: reader.result
          })
        });

        const result = await response.json();

        if (result.success) {
          toast.success("Plik przesłany!");
          setSelectedFile(null);
          if (onFileUploaded) onFileUploaded();
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        toast.error("Błąd: " + error.message);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const getFileIcon = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return FileText;
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.gif')) {
      return Image;
    }
    return FileText;
  };

  return (
    <Card className="border-2 border-slate-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-slate-600" />
          Dokumenty i zdjęcia
        </h3>

        <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-sm text-slate-600 mb-3">
            Dodaj zdjęcia postępu prac, dokumenty lub inne pliki związane z inwestycją
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="flex-1"
            />
            {selectedFile && (
              <Button onClick={() => setSelectedFile(null)} variant="outline" size="icon">
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isReadOnly}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Przesyłanie...</>
              ) : isReadOnly ? (
                <><AlertCircle className="w-4 h-4 mr-2" />Zablokowane</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Prześlij</>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Twoje pliki */}
          {clientDocuments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Twoje pliki</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clientDocuments.map((doc, idx) => {
                  const Icon = getFileIcon(doc.name);
                  return (
                    <motion.a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-xs text-slate-500">
                            {doc.uploaded_date ? format(new Date(doc.uploaded_date), 'dd.MM.yyyy', { locale: pl }) : "Brak daty"}
                          </div>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pliki od wykonawcy */}
          {contractorDocuments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Pliki od wykonawcy</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contractorDocuments.map((doc, idx) => {
                  const Icon = getFileIcon(doc.name);
                  return (
                    <motion.a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-xs text-slate-500">
                            {doc.uploaded_date ? format(new Date(doc.uploaded_date), 'dd.MM.yyyy', { locale: pl }) : "Brak daty"}
                          </div>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          )}

          {clientDocuments.length === 0 && contractorDocuments.length === 0 && (
            <p className="text-center text-slate-500 py-8">Brak dokumentów.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}