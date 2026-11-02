import { mockIPC } from "@tauri-apps/api/mocks";
import type { ToolInfo } from "@/features/home/tools";

/**
 * Stand-in backend for `bun run dev` in a plain browser, so screens can be
 * checked without the Tauri shell. Never part of a build. The Tools mirror
 * crates/rantakit-tasks/src/catalogue.rs on desktop.
 *
 * URL switches: `?recent` fills Recent tools, `?fail` makes the second file
 * of every Task miss its Size limit, `?slow` makes Tasks take longer.
 */
const TOOLS: ToolInfo[] = [
  { id: "kompres-foto", job: "kecilkan-ubah", comingSoon: false },
  { id: "kompres-pdf", job: "kecilkan-ubah", comingSoon: false },
  { id: "ubah-format-foto", job: "kecilkan-ubah", comingSoon: false },
  ...(
    [
      ["ubah-ukuran-foto", "kecilkan-ubah"],
      ["kompres-dokumen", "kecilkan-ubah"],
      ["kompres-audio", "kecilkan-ubah"],
      ["ubah-format-audio", "kecilkan-ubah"],
      ["kompres-video", "kecilkan-ubah"],
      ["word-ke-pdf", "kecilkan-ubah"],
      ["excel-ke-pdf", "kecilkan-ubah"],
      ["jpg-ke-pdf", "scan"],
      ["gabung-pdf", "atur-pdf"],
      ["pisah-pdf", "atur-pdf"],
      ["atur-halaman-pdf", "atur-pdf"],
      ["pdf-ke-jpg", "atur-pdf"],
      ["beri-watermark", "bagikan-aman"],
      ["hapus-info-lokasi", "bagikan-aman"],
    ] as const
  ).map(([id, job]) => ({ id, job, comingSoon: true })),
];

const FOLDER = "C:\\Users\\Rani\\Documents\\Lamaran CPNS\\";

/** What the file pickers return in the browser. */
export function devPick(noun: "photo" | "pdf"): Promise<string[]> {
  const names = noun === "photo" ? ["KTP.jpg", "Pas foto.png", "Ijazah scan.jpg"] : ["Ijazah.pdf", "Transkrip nilai.pdf"];
  return Promise.resolve(names.map((name) => FOLDER + name));
}

const has = (flag: string) => new URLSearchParams(location.search).has(flag);

/** A made-up but steady size for a path. */
function sizeOf(path: string) {
  let hash = 0;
  for (const char of path) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 600_000 + (hash % 3_000_000);
}

const isPdf = (path: string) => path.toLowerCase().endsWith(".pdf");
const kindOf = (path: string) => (isPdf(path) ? "pdf" : path.toLowerCase().endsWith(".png") ? "png" : "jpg");

/** A soft gradient as a JPG, in place of a real thumbnail. */
async function fakeThumbnail(path: string, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round(size * 0.75);
  const context = canvas.getContext("2d")!;
  const hue = sizeOf(path) % 360;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `hsl(${hue} 60% 75%)`);
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360} 50% 45%)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg"));
  return blob ? await blob.arrayBuffer() : new ArrayBuffer(0);
}

const cancelled = new Set<number>();
let nextTask = 1;

interface TaskArgs {
  request: { options: { tool: string; to?: string }; paths: string[] };
  onEvent: { onmessage: (message: unknown) => void };
}

function runTask({ request, onEvent }: TaskArgs) {
  const id = nextTask++;
  const send = (message: unknown) => onEvent.onmessage(message);
  const step = has("slow") ? 400 : 120;
  const suffix = request.options.tool.startsWith("ubah-format")
    ? "converted"
    : request.options.tool.startsWith("ubah-ukuran")
      ? "resized"
      : "compressed";

  (async () => {
    for (const [file, path] of request.paths.entries()) {
      for (let fraction = 0; fraction < 1; fraction += 0.2) {
        if (cancelled.has(id)) break;
        send({ event: "progress", file, fraction });
        await new Promise((resolve) => setTimeout(resolve, step));
      }
      if (cancelled.has(id)) {
        send({ event: "fileDone", file, outcome: { status: "failed", error: { code: "cancelled" } } });
        continue;
      }
      const size = sizeOf(path);
      const { to } = request.options;
      if (to && kindOf(path) === (to === "jpeg" ? "jpg" : "png")) {
        send({ event: "fileDone", file, outcome: { status: "failed", error: { code: "unchanged" } } });
        continue;
      }
      if (has("fail") && file === 1) {
        send({
          event: "fileDone",
          file,
          outcome: { status: "failed", error: { code: "size-limit-unreachable", best: Math.round(size * 0.4) } },
        });
        continue;
      }
      const dot = path.lastIndexOf(".");
      const extension = to ? (to === "jpeg" ? ".jpg" : ".png") : path.slice(dot);
      send({
        event: "fileDone",
        file,
        outcome: {
          status: "done",
          result: {
            inputPath: path,
            outputPath: `${path.slice(0, dot)} (${suffix})${extension}`,
            originalBytes: size,
            compressedBytes: Math.round(size * 0.12),
          },
        },
      });
    }
    send({ event: "finished" });
  })();
  return id;
}

export function installDevMocks() {
  mockIPC((cmd, args) => {
    switch (cmd) {
      case "list_tools":
        return TOOLS;
      case "list_history":
        return [];
      case "recent_tools":
        return has("recent") ? ["kompres-pdf", "kompres-foto"] : [];
      case "match_files": {
        const paths = (args as { paths: string[] }).paths;
        if (paths.every(isPdf)) return { status: "fits", kinds: ["pdf"], tools: ["kompres-pdf"] };
        if (paths.some(isPdf)) return { status: "mixed" };
        return { status: "fits", kinds: ["jpg"], tools: ["kompres-foto", "ubah-format-foto"] };
      }
      case "file_info":
        return (args as { paths: string[] }).paths.map((path) => ({
          size: sizeOf(path),
          kind: kindOf(path),
          pages: isPdf(path) ? 1 + (sizeOf(path) % 5) : null,
          longestSide: isPdf(path) ? null : 4000,
        }));
      case "thumbnail": {
        const { path, size } = args as { path: string; size: number };
        return isPdf(path) ? new ArrayBuffer(0) : fakeThumbnail(path, size);
      }
      case "start_task":
        return runTask(args as unknown as TaskArgs);
      case "cancel_task":
        cancelled.add((args as { id: number }).id);
        return null;
      default:
        return null;
    }
  });
}
