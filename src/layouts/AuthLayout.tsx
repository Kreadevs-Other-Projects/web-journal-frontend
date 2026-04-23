import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar";

const AuthLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default AuthLayout;
