import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import HomePage from "./pages/home";
import ProfilePage from "./pages/profile";
import BoardUserPage from "./pages/user";
import BoardAdminPage from "./pages/admin";
import ForgotPage from "./pages/forgot";
import ResetPage from "./pages/reset";
import StorePage from "./pages/store";
import SocialPage from "./pages/social";
import { WalletRoute, AdminRoute } from "./components/routing/ProtectedRoutes";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/home" element={<HomePage />} />
        <Route exact path="/login" element={<LoginPage />} />
        <Route exact path="/register" element={<RegisterPage />} />
        <Route exact path="/forgot" element={<ForgotPage />} />
        <Route exact path="/reset-password/:id/:token" element={<ResetPage />} />
        <Route
          exact
          path="/profile"
          element={
            <WalletRoute>
              <ProfilePage />
            </WalletRoute>
          }
        />
        <Route
          exact
          path="/store"
          element={
            <WalletRoute>
              <StorePage />
            </WalletRoute>
          }
        />
        <Route
          exact
          path="/social"
          element={
            <WalletRoute>
              <SocialPage />
            </WalletRoute>
          }
        />
        <Route
          path="/user"
          element={
            <WalletRoute>
              <BoardUserPage />
            </WalletRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <BoardAdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}

export default App;
