import { Routes, Route } from "react-router-dom";

import Home from "../Components/Home";
import Login from "../Components/Login";
import Register from "../Components/Register";
import AuthSuccess from "../Components/AuthSuccess";
import Account from "../Components/Account";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route path="/auth/success" element={<AuthSuccess />} />

      <Route path="/account" element={<Account />} />
    </Routes>
  );
};

export default AppRoutes;
