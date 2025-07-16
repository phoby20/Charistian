"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import EventCalendar from "@/components/EventCalendar";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { useRouter } from "@/utils/useRouter";

export default function CalendarPage() {
  const { user, error: authError, setError: setAuthError } = useAuth();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!user || isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <EventCalendar
          user={user}
          setFetchError={setFetchError}
          setIsLoading={setIsLoading}
        />
      </div>

      <ErrorModal
        authError={authError}
        fetchError={fetchError}
        onClose={() => {
          setAuthError(null);
          setFetchError(null);
          router.push("/");
        }}
      />
    </>
  );
}
