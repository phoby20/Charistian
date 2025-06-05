"use client";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserDetailModal from "@/components/UserDetailModal";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import MemberCard from "@/components/MemberCard"; // 새 컴포넌트 임포트
import { User } from "@/types/customUser";

export default function MembersPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userChurchId, setUserChurchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    if (userRole !== null && userChurchId !== null) {
      fetchMembers();
    }
  }, [userRole, userChurchId, router]);

  const handleUpdate = () => {
    fetchMembers();
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          {t("members")}
        </h1>
        {members.length === 0 ? (
          <p className="text-gray-500 italic">{t("noMembers")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {members.map((user) => (
              <MemberCard key={user.id} user={user} onClick={setSelectedUser} />
            ))}
          </div>
        )}

        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={handleUpdate}
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
