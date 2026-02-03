export function createPageUrl(name) {
  switch (name) {
    case "Home": return "/";
    case "Konfigurator": return "/Konfigurator";
    case "Oferta": return "/Oferta";
    case "ONas": return "/ONas";
    case "Kontakt": return "/Kontakt";
    case "PolitykaPrywatnosci": return "/PolitykaPrywatnosci";
    case "Sukces": return "/Sukces";
    case "CoZyskasz": return "/CoZyskasz";
    case "StatusInwestycji": return "/StatusInwestycji";
    case "FAQ": return "/FAQ";
    case "Realizacje": return "/Realizacje";
    case "Instalator": return "/Instalator";
    default: return "/";
  }
}