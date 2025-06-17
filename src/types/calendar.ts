import { Prisma } from "@prisma/client";

export type CustomCalendarEvent = Prisma.EventGetPayload<{
  include: {
    church: true;
    group: true;
    subGroup: true;
    team: true;
    creator: true;
    attendees: { include: { user: true } };
    label?: string;
  };
}>;

// newEvent의 타입을 커스텀으로 정의하여 Date와 label을 허용
export type NewEvent = Partial<
  Pick<
    CustomCalendarEvent,
    "title" | "description" | "roles" | "status" | "recurrence" | "notifyBefore"
  >
> & {
  startDate?: Date;
  endDate?: Date;
  label?: string | null; // 수정: null을 허용
};
