// src/components/UserDetailModal.tsx
import { useState } from "react";
import { User } from "@/types/customUser";
import UserDetailView from "./UserDetailView";
import UserDetailEditForm from "./UserDetailEditForm";
import { useUserDetailData } from "@/app/hooks/useUserDetailData";

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onUpdate?: (updatedUser: User) => void;
}

export default function UserDetailModal({
  user: initialUser,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onUpdate,
}: UserDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User>(initialUser);
  const { positions, groups, subGroups, duties, isLoading, error } =
    useUserDetailData(
      user.churchId || "", // churchId가 null일 경우 빈 문자열
      user.group?.id || null
    );

  if (!isOpen) return null;

  if (!user.churchId) {
    return <p className="text-red-600">교회 ID가 없습니다.</p>;
  }

  return isEditing ? (
    <UserDetailEditForm
      user={user}
      isOpen={isOpen}
      onClose={() => {
        setIsEditing(false);
        onClose();
      }}
      onSave={(updatedUser: User) => {
        console.log("업데이트된 사용자:", updatedUser);
        setUser(updatedUser);
        setIsEditing(false); // UserDetailView로 전환
        onUpdate?.(updatedUser);
      }}
      positions={positions}
      groups={groups}
      subGroups={subGroups}
      duties={duties}
      isLoading={isLoading}
      error={error}
    />
  ) : (
    <UserDetailView
      user={user}
      isOpen={isOpen}
      onClose={onClose}
      onApprove={onApprove}
      onReject={onReject}
      onEdit={() => setIsEditing(true)}
      isLoading={isLoading}
      error={error}
    />
  );
}
