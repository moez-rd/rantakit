import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/components/layout/navigation";
import { ImageJobView } from "@/features/compress/ImageJobView";
import { ImageSetupView } from "@/features/compress/ImageSetupView";
import { DropOverlay } from "@/features/compress/DropOverlay";
import { isImagePath, pickImages } from "@/features/compress/imageApi";
import { useImageSettings } from "@/features/compress/imageSettings";
import { useImageJob } from "@/features/compress/useImageJob";
import { HomePage } from "@/features/home/HomePage";
import { RecentsPage } from "@/features/recents/RecentsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { hasSettingsWindow, openSettingsWindow } from "@/features/settings/settingsWindow";
import { useFileDrop } from "@/lib/fileDrop";
import { useMenuEvents } from "@/lib/menuEvents";

function App() {
  const [page, setPage] = useState<Page>("home");
  const imageJob = useImageJob();

  const navigate = (next: Page) => {
    if (next === "settings" && hasSettingsWindow) {
      openSettingsWindow();
    } else {
      setPage(next);
    }
  };

  // Picked images waiting for the user to choose settings; empty when not reviewing.
  const [selected, setSelected] = useState<string[]>([]);
  const [imageSettings, updateImageSettings] = useImageSettings();

  /** Add images to the selection and show the settings, from the picker or a drop. */
  const addImages = (paths: string[]) => {
    if (imageJob.isRunning || paths.length === 0) return;
    imageJob.clear();
    setSelected((prev) => [...new Set([...prev, ...paths])]);
    setPage("home");
  };

  const pickImagesToCompress = async () => {
    if (imageJob.isRunning) return;
    addImages(await pickImages());
  };

  const drag = useFileDrop(isImagePath, addImages);

  const startImageJob = () => {
    imageJob.start(selected, imageSettings);
    setSelected([]);
  };

  const homeView = () => {
    if (imageJob.items.length > 0) {
      return <ImageJobView job={imageJob} onCompressMore={pickImagesToCompress} />;
    }
    if (selected.length > 0) {
      return (
        <ImageSetupView
          paths={selected}
          settings={imageSettings}
          onSettingsChange={updateImageSettings}
          onAddMore={pickImagesToCompress}
          onRemove={(path) => setSelected((prev) => prev.filter((p) => p !== path))}
          onCancel={() => setSelected([])}
          onStart={startImageJob}
        />
      );
    }
    return <HomePage onCompressImage={pickImagesToCompress} />;
  };

  useMenuEvents((id) => {
    switch (id) {
      case "go_home":
        return navigate("home");
      case "go_recents":
        return navigate("recents");
      case "open_settings":
        return navigate("settings");
      case "compress_image":
        return pickImagesToCompress();
      case "compress_pdf":
        // TODO: open the PDF picker once PDF compression exists.
        return navigate("home");
    }
  });

  return (
    <AppShell page={page} onNavigate={navigate}>
      {page === "home" && homeView()}
      {page === "recents" && <RecentsPage />}
      {page === "settings" && <SettingsPage />}
      {drag && <DropOverlay drag={drag} isBusy={imageJob.isRunning} />}
    </AppShell>
  );
}

export default App;
