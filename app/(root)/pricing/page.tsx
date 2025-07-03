import { PricingTable } from "@clerk/nextjs";

const Pricing = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
      <PricingTable />
    </div>
  );
};

export default Pricing;
