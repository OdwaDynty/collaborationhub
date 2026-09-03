import { FolderOpen } from "lucide-react";
import type { ChannelFile } from "@/types/files";
import { FileIcon } from "./file-icon";
import { DownloadButton } from "./download-button";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files, showChannel = false }: { files: ChannelFile[]; showChannel?: boolean }) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-white py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10">
          <FolderOpen className="h-5 w-5 text-brand-teal-ink" />
        </div>
        <p className="text-sm font-medium text-ink">No files shared yet</p>
        <p className="max-w-xs text-sm text-ink/50">
          Files you upload to a channel will show up here for everyone in it.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {files.map((file) => (
        <li key={file.id} className="flex items-center gap-3 p-3">
          <FileIcon fileName={file.file_name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.file_name}</p>
            <p className="text-xs text-ink/40">
              {file.uploader.full_name} · {formatFileSize(file.file_size)}
              {showChannel && file.channel && ` · # ${file.channel.name}`}
            </p>
          </div>
          <DownloadButton storagePath={file.storage_path} />
        </li>
      ))}
    </ul>
  );
}