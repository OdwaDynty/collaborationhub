import { FileText, FileSpreadsheet, Image as ImageIcon, FileArchive, File as FileGeneric } from "lucide-react";

export function FileIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (["xlsx", "xls", "csv"].includes(ext)) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10">
        <FileSpreadsheet className="h-4 w-4 text-brand-teal-ink" />
      </div>
    );
  }
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15">
        <ImageIcon className="h-4 w-4 text-brand-gold" />
      </div>
    );
  }
  if (["zip", "rar", "7z"].includes(ext)) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10">
        <FileArchive className="h-4 w-4 text-brand-teal-ink" />
      </div>
    );
  }
  if (["pdf", "doc", "docx", "txt"].includes(ext)) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15">
        <FileText className="h-4 w-4 text-brand-gold" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-canvas">
      <FileGeneric className="h-4 w-4 text-ink/40" />
    </div>
  );
}