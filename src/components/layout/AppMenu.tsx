import { MoreHorizontal } from "@keyline-icons/react";
import { Keyboard } from "react-aria-components";
import { Button } from "@/components/ui/Button";
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/Menu";
import { SHORTCUTS, type AppCommand } from "@/lib/appCommands";

interface AppMenuProps {
  onCommand: (command: AppCommand) => void;
}

function Item({ id, children }: { id: AppCommand; children: string }) {
  const shortcut = SHORTCUTS[id];
  return (
    <MenuItem id={id} textValue={children}>
      {children}
      {shortcut && <Keyboard className="ms-auto ps-6 text-small opacity-60">{shortcut.label}</Keyboard>}
    </MenuItem>
  );
}

/**
 * The app's commands on Windows and Linux, which have no native menu bar.
 * macOS uses the menu bar from src-tauri/src/menu.rs instead.
 */
export function AppMenu({ onCommand }: AppMenuProps) {
  return (
    <MenuTrigger placement="bottom start">
      <Button variant="icon" aria-label="Menu">
        <MoreHorizontal aria-hidden className="size-5" />
      </Button>
      <Menu onAction={(key) => onCommand(key as AppCommand)}>
        <Item id="compress_image">Kompres gambar…</Item>
        <Item id="compress_pdf">Kompres PDF…</Item>
        <MenuSeparator />
        <Item id="open_source">Kode sumber</Item>
        <Item id="open_license">Lisensi</Item>
        <Item id="open_about">Tentang Rantakit</Item>
      </Menu>
    </MenuTrigger>
  );
}
