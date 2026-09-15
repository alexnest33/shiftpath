"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidCalendarDate } from "@/lib/schedule/calendar";
import {
  getSchedulePattern,
  isScheduleType,
  parseCustomPattern,
} from "@/lib/schedule/patterns";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleType } from "@/types/domain";
import type { ScheduleActionState } from "@/types/schedule";

interface ValidScheduleInput {
  name: string;
  scheduleType: ScheduleType;
  startsOn: string;
  pattern: boolean[];
}

function validateSchedule(formData: FormData): {
  input?: ValidScheduleInput;
  fieldErrors?: ScheduleActionState["fieldErrors"];
} {
  const rawName = formData.get("name");
  const rawType = formData.get("scheduleType");
  const rawStartsOn = formData.get("startsOn");
  const rawCustomPattern = formData.get("customPattern");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const scheduleType = typeof rawType === "string" ? rawType : "";
  const startsOn = typeof rawStartsOn === "string" ? rawStartsOn : "";
  const customPattern =
    typeof rawCustomPattern === "string"
      ? parseCustomPattern(rawCustomPattern)
      : null;
  const fieldErrors: NonNullable<ScheduleActionState["fieldErrors"]> = {};

  if (name.length < 1 || name.length > 100) {
    fieldErrors.name = "Название должно содержать от 1 до 100 символов.";
  }

  if (!isScheduleType(scheduleType)) {
    fieldErrors.scheduleType = "Выберите допустимый тип графика.";
  }

  if (!isValidCalendarDate(startsOn)) {
    fieldErrors.startsOn = "Укажите корректную дату начала цикла.";
  }

  const pattern = isScheduleType(scheduleType)
    ? getSchedulePattern(scheduleType, customPattern ?? [])
    : null;

  if (!pattern) {
    fieldErrors.customPattern =
      "Добавьте в цикл от 1 до 366 рабочих или выходных дней.";
  }

  if (Object.keys(fieldErrors).length > 0 || !pattern || !isScheduleType(scheduleType)) {
    return { fieldErrors };
  }

  return {
    input: {
      name,
      scheduleType,
      startsOn,
      pattern,
    },
  };
}

export async function saveSchedule(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const validation = validateSchedule(formData);

  if (!validation.input) {
    return {
      status: "error",
      message: "Проверьте поля формы.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  try {
    const { data: activeSchedule, error: lookupError } = await supabase
      .from("schedules")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError) {
      return {
        status: "error",
        message: "Не удалось проверить текущий график. Попробуйте ещё раз.",
      };
    }

    const values = {
      name: validation.input.name,
      schedule_type: validation.input.scheduleType,
      starts_on: validation.input.startsOn,
      cycle_pattern: validation.input.pattern,
      is_active: true,
    };

    const result = activeSchedule
      ? await supabase
          .from("schedules")
          .update(values)
          .eq("id", activeSchedule.id)
          .eq("user_id", user.id)
          .eq("is_active", true)
      : await supabase.from("schedules").insert({
          ...values,
          user_id: user.id,
        });

    if (result.error) {
      return {
        status: "error",
        message: "Не удалось сохранить график. Попробуйте ещё раз.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Сервис временно недоступен. Попробуйте ещё раз.",
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "График сохранён.",
  };
}
