import { DashboardLayout } from "../components/layout/DashboardLayout";
import { InboxView } from "../components/InboxView";

function Inbox() {
  return (
    <DashboardLayout title="Inbox">
      <InboxView />
    </DashboardLayout>
  );
}

export default Inbox;
