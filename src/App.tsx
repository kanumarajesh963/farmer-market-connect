import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import MarketplacePage from './features/marketplace/MarketplacePage';
import ListingDetailPage from './features/marketplace/ListingDetailPage';
import FarmerDashboard from './features/farmer/FarmerDashboard';
import CropListingForm from './features/farmer/CropListingForm';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/dashboard" element={<FarmerDashboard />} />
          <Route path="/post-crop" element={<CropListingForm />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/marketplace" replace />} />
    </Routes>
  );
}
