import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    console.log("TOKEN RECEIVED:", !!token);

    if (token) {
      localStorage.setItem("token", token);

      console.log("TOKEN STORED");

      // Go to Home
      navigate("/", { replace: true });
    } else {
      console.log("NO TOKEN FOUND");
      navigate("/login", { replace: true });
    }
  }, [navigate, searchParams]);

  return <div>Logging you in...</div>;
};

export default AuthSuccess;
