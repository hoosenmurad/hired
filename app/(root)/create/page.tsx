import { newInterviewPermissions } from "@/lib/actions/general.action";
import CreateForm from "@/components/CreateForm";

const NewInterview = async () => {
  const permissions = await newInterviewPermissions();
  return (
    <main className=" items-center justify-center">
      <article className="w-full gap-4 flex flex-col">
        <CreateForm permissions={permissions} />
      </article>
    </main>
  );
};

export default NewInterview;
