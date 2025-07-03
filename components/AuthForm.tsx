"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const AuthForm = ({ type }: { type: FormType }) => {
  return (
    <div className="card-border">
      <div className="flex flex-col gap-6 card py-14 px-10">
        {type === "sign-in" ? (
          <SignIn appearance={{ baseTheme: dark }} />
        ) : (
          <SignUp appearance={{ baseTheme: dark }} />
        )}
      </div>
    </div>
  );
};

export default AuthForm;
