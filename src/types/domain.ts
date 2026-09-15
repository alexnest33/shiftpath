export type Uuid = string;
export type IsoDate = string;
export type IsoTimestamp = string;

export type ScheduleType = "2_2" | "3_3" | "2_2_3" | "custom";
export type GoalStatus = "active" | "completed" | "archived";
export type StudySessionStatus = "planned" | "completed" | "cancelled";

export interface Profile {
  id: Uuid;
  display_name: string | null;
  timezone: string;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface Schedule {
  id: Uuid;
  user_id: Uuid;
  name: string;
  schedule_type: ScheduleType;
  starts_on: IsoDate;
  /** A repeating cycle where true is a work day and false is a day off. */
  cycle_pattern: boolean[];
  is_active: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface Goal {
  id: Uuid;
  user_id: Uuid;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: IsoDate | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface StudySession {
  id: Uuid;
  user_id: Uuid;
  goal_id: Uuid;
  starts_at: IsoTimestamp;
  duration_minutes: number;
  status: StudySessionStatus;
  notes: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}
