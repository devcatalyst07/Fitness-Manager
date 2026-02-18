import UserProfile from "@/components/Settings/user/UserProfile";
import SessionGuard from "@/components/SessionGuard";

export default function Page() {
  return (
    <SessionGuard>
      <UserProfile />
    </SessionGuard>
  );
}
