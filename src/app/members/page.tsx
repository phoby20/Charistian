// src/app/members/page.tsx
"use client";

import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserDetailModal from "@/components/UserDetailModal";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Image from "next/image";
import { User as PrismaUser } from "@prisma/client";

interface Position {
  id: string;
  name: string;
}

interface User
  extends Omit<PrismaUser, "position" | "birthDate" | "createdAt"> {
  position: Position | null;
  birthDate: string;
  createdAt: string;
}

export default function MembersPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user.role);
          setUserChurchId(data.user.churchId);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(t("serverError"));
      }
    };
    fetchUserRole();
  }, [router]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
          router.push("/login");
          return;
        }
        if (!userChurchId) {
          setMembers([]);
          return;
        }
        const response = await fetch("/api/members");
        if (!response.ok) throw new Error("Failed to fetch members");
        const { members } = await response.json();
        const filteredMembers = members.filter(
          (user: User) => user.churchId === userChurchId
        );
        setMembers(filteredMembers);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError(t("serverError"));
      }
    };

    if (userRole !== null && userChurchId !== null) {
      fetchMembers();
    }
  }, [userRole, userChurchId, router]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {t("members")}
        </h1>
        {members.length === 0 ? (
          <p className="text-gray-500 italic">{t("noMembers")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-lg p-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer flex items-center space-x-4"
                onClick={() => setSelectedUser(user)}
                role="button"
                aria-label={t("viewUserDetails", { name: user.name })}
              >
                <Image
                  src={user.profileImage || "/default_user.png"}
                  alt={user.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => (e.currentTarget.src = "/default_user.png")}
                />
                <div>
                  <p className="text-lg font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">
                    {user.position ? user.position.name : t("noPosition")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}

        {error && (
          <Modal isOpen={!!error}>
            <p className="text-red-600">{error}</p>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setError(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                {t("close")}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
