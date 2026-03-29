import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import './tailwind-output.css';
import ErrorBoundary from "./components/ErrorBoundary";

// Strona główna ładowana od razu (SEO)
import Home from "./pages/Home";

// Pozostałe strony publiczne — lazy
const CoZyskasz        = React.lazy(() => import("./pages/CoZyskasz"));
const Konfigurator     = React.lazy(() => import("./pages/Konfigurator"));
const Oferta           = React.lazy(() => import("./pages/Oferta"));
const ONas             = React.lazy(() => import("./pages/ONas"));
const Kontakt          = React.lazy(() => import("./pages/Kontakt"));
const PolitykaPrywatnosci = React.lazy(() => import("./pages/PolitykaPrywatnosci"));
const StatusInwestycji = React.lazy(() => import("./pages/StatusInwestycji"));
const FAQ              = React.lazy(() => import("./pages/FAQ"));
const Realizacje       = React.lazy(() => import("./pages/Realizacje"));
const Instalator       = React.lazy(() => import("./pages/Instalator"));
const NotFound         = React.lazy(() => import("./pages/NotFound"));

// Panel admina — lazy (największy chunk, tylko dla admina)
const Admin = React.lazy(() => import("./pages/Admin"));

function PublicSite() {
  return (
    <Layout>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/CoZyskasz" element={<CoZyskasz />} />
          <Route path="/Konfigurator" element={<Konfigurator />} />
          <Route path="/Oferta" element={<Oferta />} />
          <Route path="/ONas" element={<ONas />} />
          <Route path="/Kontakt" element={<Kontakt />} />
          <Route path="/PolitykaPrywatnosci" element={<PolitykaPrywatnosci />} />
          <Route path="/StatusInwestycji" element={<StatusInwestycji />} />
          <Route path="/FAQ" element={<FAQ />} />
          <Route path="/Realizacje" element={<Realizacje />} />
          <Route path="/Instalator" element={<Instalator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route path="/*" element={<PublicSite />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
