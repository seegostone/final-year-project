import { createBrowserRouter } from "react-router";
import { TechnicianDashboard } from "./pages/TechnicianDashboard";
import { TaskDetail } from "./pages/TaskDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: TechnicianDashboard,
  },
  {
    path: "/task/:complaintId/:taskId",
    Component: TaskDetail,
  },
]);
