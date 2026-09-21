import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider } from "./store.jsx";
import { ToastProvider } from "./components/toast.jsx";
import { Layout } from "./components/Layout.jsx";
import { Home } from "./pages/Home.jsx";
import { Vision } from "./pages/Vision.jsx";
import { Market } from "./pages/Market.jsx";
import { Suppliers } from "./pages/Suppliers.jsx";
import { SupplierProfile } from "./pages/SupplierProfile.jsx";
import { Products } from "./pages/Products.jsx";
import { Deals } from "./pages/Deals.jsx";
import { DealRoom } from "./pages/DealRoom.jsx";
import { Escrow } from "./pages/Escrow.jsx";
import { Logistics } from "./pages/Logistics.jsx";
import { Broker } from "./pages/Broker.jsx";
import { Admin } from "./pages/Admin.jsx";
import { Compliance } from "./pages/Compliance.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/market" element={<Market />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/suppliers/:id" element={<SupplierProfile />} />
              <Route path="/products" element={<Products />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/:id" element={<DealRoom />} />
              <Route path="/escrow" element={<Escrow />} />
              <Route path="/logistics" element={<Logistics />} />
              <Route path="/broker" element={<Broker />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}