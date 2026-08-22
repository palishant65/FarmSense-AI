import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { FarmProvider, useFarm } from "./context/FarmContext";
import { getToken } from "./services/api";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Irrigation from "./pages/Irrigation";
import Doctor from "./pages/Doctor";
import { Weather, Soil, Crops, FarmMap } from "./pages/WeatherSoilCrops";
import {
  Analytics, Market, Schemes, Assistant, Tasks, Alerts, Iot, Impact, Reports, FarmPage, Settings,
} from "./pages/MorePages";

function RequireAuth() {
  const { user } = useFarm() || {};
  if (!getToken() && !user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <FarmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/farm" element={<FarmPage />} />
              <Route path="/map" element={<FarmMap />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/doctor" element={<Doctor />} />
              <Route path="/irrigation" element={<Irrigation />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/soil" element={<Soil />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/market" element={<Market />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/iot" element={<Iot />} />
              <Route path="/crops" element={<Crops />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FarmProvider>
  );
}
