import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import HomePage from "./pages/home";
import ProfilePage from "./pages/profile";
import BoardUserPage from "./pages/user";
import BoardModeratorPage from "./pages/moderator";
import BoardAdminPage from "./pages/admin";
import ForgotPage from "./pages/forgot";
import ResetPage from "./pages/reset";
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
        <Route
          exact
          path="/reset-password/:id/:token"
          element={<ResetPage />}
        />
        <Route exact path="/profile" element={<ProfilePage />} />
        <Route path="/user" element={<BoardUserPage />} />
        {/* <Route path="/mod" element={<BoardModeratorPage />} /> */}
        <Route path="/admin" element={<BoardAdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
