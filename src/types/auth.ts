export interface AuthActionState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
}
