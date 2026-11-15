"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api-client";
import { exportBundleSchema, type ExportBundleInput } from "@/lib/schemas";
import { buttonClass, Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
import { DRAFT_STORAGE_KEY } from "@/lib/constants";

export function DataScreen() {
  return (
    <div className="space-y-4">
      <ExportCard />
      <ImportCard />
      <DeleteAllCard />
    </div>
  );
}

function ExportCard() {
  return (
    <Card aria-labelledby="export-title">
      <CardHeader title="Export" titleId="export-title" subtitle="Download a copy of your log." />
      <div className="flex flex-wrap gap-3">
        <a href={api.exportUrl("json")} download className={buttonClass("primary")}>
          <Download size={18} aria-hidden /> Export JSON
        </a>
        <a href={api.exportUrl("csv")} download className={buttonClass("secondary")}>
          <Download size={18} aria-hidden /> Export CSV
        </a>
      </div>
      <p className="mt-3 text-[13px] text-ink-soft">JSON has everything (updates, goals, settings). CSV has updates only, for spreadsheets.</p>
    </Card>
  );
}

function ImportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ name: string; data: ExportBundleInput } | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  async function onFile(file: File) {
    setError(null);
    setParsed(null);
    try {
      const json = JSON.parse(await file.text()) as unknown;
      const result = exportBundleSchema.safeParse(json);
      if (!result.success) {
        const issue = result.error.issues[0];
        setError(`That file is not a Rumbodia export. ${issue ? `(${issue.path.join(".") || "file"}: ${issue.message})` : ""}`);
        return;
      }
      setParsed({ name: file.name, data: result.data });
    } catch {
      setError("That file is not valid JSON. Choose a file you exported from Rumbodia.");
    }
  }

  async function runImport() {
    if (!parsed) return;
    setBusy(true);
    try {
      const imported = await api.importData(parsed.data, mode);
      await qc.invalidateQueries();
      toast.show({ message: `Imported ${imported.entries} updates and ${imported.goals} goals.` });
      setParsed(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card aria-labelledby="import-title">
      <CardHeader title="Import" titleId="import-title" subtitle="Load a JSON file exported from Rumbodia." />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        id="import-file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />
      <label htmlFor="import-file" className={buttonClass("secondary", "md", "cursor-pointer")}>
        <Upload size={18} aria-hidden /> Choose a file
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-[14px] bg-danger-soft p-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      {parsed && (
        <div className="mt-4 space-y-4 rounded-[14px] bg-bg p-4">
          <p className="text-[15px]">
            <span className="font-semibold break-all">{parsed.name}</span>:{" "}
            <span className="tabular">
              {parsed.data.entries.length} entries, {parsed.data.goals.length} goals
            </span>
            {parsed.data.settings ? ", settings" : ""}.
          </p>
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-soft">How to import</p>
            <SegmentedControl
              label="Import mode"
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: "merge", label: "Merge by id" },
                { value: "replace", label: "Replace all" },
              ]}
            />
            <p className="mt-2 text-[13px] text-ink-soft">
              {mode === "merge"
                ? "Adds new updates and goals. Ones with the same id are replaced by the file's version."
                : "Deletes your current updates and goals first, then loads the file."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={runImport} loading={busy} variant={mode === "replace" ? "danger" : "primary"}>
              {mode === "replace" ? "Replace and import" : "Import"}
            </Button>
            <Button variant="ghost" onClick={() => setParsed(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function DeleteAllCard() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  async function run() {
    setBusy(true);
    try {
      await api.deleteAllData();
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      await qc.invalidateQueries();
      toast.show({ message: "All your data was deleted." });
      setOpen(false);
      setTyped("");
    } catch (err) {
      toast.show({ message: (err as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card aria-labelledby="delete-title">
      <CardHeader title="Delete all data" titleId="delete-title" subtitle="Removes every update, goal, weekly read and setting. This cannot be undone." />
      <Button variant="danger" icon={<Trash2 size={18} aria-hidden />} onClick={() => setOpen(true)}>
        Delete everything
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete all your data?"
        description="Export first if you might want it back."
        confirmLabel="Delete everything"
        tone="danger"
        confirmDisabled={typed !== "DELETE"}
        loading={busy}
        onConfirm={run}
        onCancel={() => {
          setOpen(false);
          setTyped("");
        }}
      >
        <label className="block text-[15px] font-semibold" htmlFor="delete-confirm">
          Type DELETE to confirm
        </label>
        <input
          id="delete-confirm"
          data-autofocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="mt-2 h-11 w-full rounded-[12px] border border-line bg-card px-3 text-[16px] tracking-wide"
        />
      </ConfirmDialog>
    </Card>
  );
}
