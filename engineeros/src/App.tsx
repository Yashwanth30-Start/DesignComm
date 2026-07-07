import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DataProvider } from "./state/DataProvider";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Knowledge from "./pages/Knowledge";
import Documents from "./pages/Documents";
import Ideas from "./pages/Ideas";
import Learning from "./pages/Learning";
import Journal from "./pages/Journal";
import WeeklyReviewPage from "./pages/WeeklyReviewPage";
import SearchPage from "./pages/SearchPage";
import Settings from "./pages/Settings";
import { EmptyState } from "./components/ui/primitives";

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/meetings/:id" element={<MeetingDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/review" element={<WeeklyReviewPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={<EmptyState message="Page not found." hint="Use the sidebar to get back." />}
            />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </DataProvider>
  );
}
