"use client";

import { SignIn, SignUp } from "@clerk/nextjs";

const AuthForm = ({ type }: { type: FormType }) => {
  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        {type === "sign-in" ? <SignIn /> : <SignUp />}
      </div>
    </div>
  );
};

export default AuthForm;
