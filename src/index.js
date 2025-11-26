import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import './tailwind-output.css';

// Strony
import Home from "./pages/Home";
import CoZyskasz from "./pages/CoZyskasz";
import Konfigurator from "./pages/Konfigurator";
import Oferta from "./pages/Oferta";
import ONas from "./pages/ONas";
import Kontakt from "./pages/Kontakt";
import PolitykaPrywatnosci from "./pages/PolitykaPrywatnosci";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
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
        </Routes>
      </Layout>
    </BrowserRouter>
  </React.StrictMode>
);
