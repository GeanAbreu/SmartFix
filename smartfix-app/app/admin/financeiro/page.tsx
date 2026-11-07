import AdminConsole from "../AdminConsole";
import RefundRequests from "./RefundRequests";

export default function Page() {
  return (
    <>
      <AdminConsole section="finance" />
      <RefundRequests embedded />
    </>
  );
}
