import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import './tailwind-output.css';
import ErrorBoundary from "./components/ErrorBoundary";

// Strony
import Home from "./pages/Home";
import CoZyskasz from "./pages/CoZyskasz";
import Konfigurator from "./pages/Konfigurator";
import Oferta from "./pages/Oferta";
import ONas from "./pages/ONas";
import Kontakt from "./pages/Kontakt";
import PolitykaPrywatnosci from "./pages/PolitykaPrywatnosci";
import StatusInwestycji from "./pages/StatusInwestycji";
import FAQ from "./pages/FAQ";
import Realizacje from "./pages/Realizacje";
import Instalator from "./pages/Instalator";
import NotFound from "./pages/NotFound";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
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
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
