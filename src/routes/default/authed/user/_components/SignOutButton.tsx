import { Button } from "@mantine/core";
import { useNavigate } from "react-router";

import { authClient } from "@/utils/auth/auth-client";

const SignOutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/");
  };

  return (
    <Button color="red" fullWidth onClick={handleLogout}>
      ログアウト
    </Button>
  );
};

export default SignOutButton;
