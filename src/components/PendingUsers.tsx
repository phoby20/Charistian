import { useTranslation } from "next-i18next";
import Button from "./Button";
import { User } from "@prisma/client";

interface PendingUsersProps {
  pendingUsers: User[];
  userRole: string | null;
  onApproveUser: (userId: string) => void;
  onRejectUser: (id: string) => void;
}

export default function PendingUsers({
  pendingUsers,
  userRole,
  onApproveUser,
  onRejectUser,
}: PendingUsersProps) {
  const { t } = useTranslation("common");

  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {t("pendingUsers")}
      </h2>
      {pendingUsers.length === 0 ? (
        <p className="text-gray-500 italic">{t("noPendingUsers")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <p className="text-lg font-bold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                {t("position")}: {user.position}
              </p>
              <p className="text-sm text-gray-500">
                {t("createdAt")}:{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-4 flex space-x-2">
                <Button
                  onClick={() => onApproveUser(user.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  {t("approve")}
                </Button>
                <Button
                  onClick={() => onRejectUser(user.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  {t("reject")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
