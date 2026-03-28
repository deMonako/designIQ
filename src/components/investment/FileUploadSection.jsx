import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Upload, FileText, Image, Download, Loader2, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { gasPost } from "../../admin/api/gasClient";

// Bezpieczne formatowanie daty — obsługuje ISO strings i YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return "Brak daty";
  const s = String(dateStr).substring(0, 10);
  if (s.length < 10) return "Brak daty";
  const [y, m, d] = s.split("-");
  return `${d}.${m}.${y}`;
}

export default function FileUploadSection({ investment, onFileUploaded, isReadOnly }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- LOGIKA FILTROWANIA DOKUMENTÓW ---
  // Definiujemy listy przed renderowaniem
  const allDocs = investment?.documents || [];
  
  const clientDocuments = allDocs.filter((doc) => doc.uploaded_by === "Klient");
  const contractorDocuments = allDocs.filter((doc) => doc.uploaded_by !== "Klient");

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
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (e) => resolve(e.target.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const code = investment.code || investment.investment_code;

      await gasPost("uploadInvestmentFile", {
        code,
        base64,
        name:     selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
      });

      toast.success("Plik przesłany pomyślnie!");
      setSelectedFile(null);
      if (onFileUploaded) await onFileUploaded();
    } catch (error) {
      toast.error("Błąd przesyłania: " + (error.message || "Sprawdź połączenie"));
    } finally {
      setIsUploading(false);
    }
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
                            {formatDate(doc.uploaded_date)}
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
                            {formatDate(doc.uploaded_date)}
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
FileUploadSection.propTypes = {
  investment: PropTypes.shape({
    investment_code: PropTypes.string,
    client_name: PropTypes.string,
    documents: PropTypes.array,
  }).isRequired,
  onFileUploaded: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool,
};
