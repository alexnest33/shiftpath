import type { ScheduleType } from "@/types/domain";

export interface ActiveScheduleFormValue {
  name: string;
  schedule_type: ScheduleType;
  starts_on: string;
  cycle_pattern: boolean[];
}

export interface ScheduleActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: {
    name?: string;
    scheduleType?: string;
    startsOn?: string;
    customPattern?: string;
  };
}
