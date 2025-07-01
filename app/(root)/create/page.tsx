import CreateForm from "@/components/CreateForm";

const page = () => {
  return (
    <main className="min-lg:w-1/3 min-md:w-2/3 items-center justify-center">
      <article className="w-full gap-4 flex flex-col">
        <h1 className="text-2xl font-bold">Create a new interview</h1>
        <CreateForm />
      </article>
    </main>
  );
};

export default page;
