"use client";

import { signIn } from "next-auth/react";
import { Button } from "@mantine/core";
import { FaGithub } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const GitHubLogin = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  return (
    <Button 
      variant="outline" 
      color="black"
      leftSection={<FaGithub />}
      onClick={() => {
        signIn('github', {
          callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
        });
      }}
    >
      Login
    </Button>
  );
};
