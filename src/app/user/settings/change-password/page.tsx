import UserChangePassword from "@/components/Settings/user/UserChangePassword";
import SessionGuard from "@/components/SessionGuard";

export default function Page() {
  return (
    <SessionGuard>
      <UserChangePassword />
    </SessionGuard>
  );
}
