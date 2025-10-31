"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, ButtonTooltip } from "@/components/ui/button";
import {
  Loader2,
  Download,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Upload,
  X,
  RefreshCw,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input"; // Add your Input component
import { getFolderList, uploadDataFile, getFolderById } from "@/lib/actions/data-bank";
import { DataFile, Folder } from "@/lib/repositories/dataRepository";
import { formatDateTime } from "@/lib/utils/date";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { Container } from "@/components/ui/container";
import AddFolder from "./blocks/AddItem";
import { FileTransfer } from "@/lib/helpers/file-helper";
import { formatFileSize } from "@/lib/utils";

export default function ExcelFileList() {
  const [groups, setGroups] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Folder | null>(null);
  const [form, setForm] = useState(false);
  const [reload, setReload] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [refreshingFolder, setRefreshingFolder] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // 👈 NEW
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const { showError, showSuccess } = useGlobalDialog();

  // Refresh specific folder
  const refreshFolder = async (folderId: number) => {
    try {
      setRefreshingFolder(folderId);
      const resp = await getFolderById(folderId);

      if (resp.success) {
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.folder_id === folderId ? resp.result : group
          )
        );
      } else {
        showError("Failed to refresh folder", '');
      }
    } catch (error) {
      showError("An unexpected error occurred while refreshing", '');
    } finally {
      setRefreshingFolder(null);
    }
  };

  async function uploadFileFunc(folderId: number, file: File) {
    if (!file) {
      showError("Something wrong with file!", '');
      return;
    }
    try {
      setUploadingFor(folderId);
      const fileData: FileTransfer = {
        name: file.name,
        type: file.type,
        arrayBuffer: Array.from(new Uint8Array(await file.arrayBuffer()))
      };

      const resp = await uploadDataFile(folderId, fileData);

      if (resp.success) {
        await refreshFolder(folderId);
      } else {
        showError("Failed to upload file", '');
      }
    } catch (error) {
      showError("An unexpected error occurred", '');
    } finally {
      setUploadingFor(null);
    }
  }

  const handleFileSelect = (folderId: number, file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      showError("Please upload a valid Excel or CSV file", '');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showError("File size must be less than 10MB", '');
      return;
    }

    uploadFileFunc(folderId, file);
  };

  const handleDragOver = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(folderId, files[0]);
    }
  };

  const handleButtonClick = (folderId: number) => {
    fileInputRefs.current[folderId]?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, folderId: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(folderId, files[0]);
    }
    e.target.value = '';
  };

  const refreshAllFolders = async () => {
    try {
      setGroups([]);
      setLoading(true);
      const resp = await getFolderList();

      if (resp.success) {
        setGroups(resp.result);
      }
    } catch (error) {
      showError("An unexpected error occurred", '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setGroups([]);
        setLoading(true);
        const resp = await getFolderList();

        if (resp.success) {
          setGroups(resp.result);
        }
      } catch (error) {
        showError("An unexpected error occurred", '');
      } finally {
        setLoading(false);
      }
    })();
  }, [reload, form]);

  // Filtered folders based on search
  const filteredGroups = groups.filter((group) => {
    const term = searchTerm.toLowerCase();
    const folderName = group.folder_name.toLowerCase();
    const orgName = group.org_name?.toLowerCase() || "";
    const hasMatchingFile = group.files.some(f => f.file_name.toLowerCase().includes(term));

    return (
      folderName.includes(term) ||
      orgName.includes(term) ||
      hasMatchingFile
    );
  });

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
        <span className="ml-2 text-gray-600">Loading files...</span>
      </div>
    );

  return (
    <Container>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage all folders and their files</CardDescription>
        </CardHeader>

        <div className="flex items-center gap-2">
          {/* 🔍 Search box */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-56"
            />
          </div>

          <ButtonTooltip
            variant="outline"
            onClick={refreshAllFolders}
            disabled={loading}
            title="Refresh all folders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </ButtonTooltip>
          
          {form
            ? <Button variant={'outline'} onClick={() => { setForm(false); setSelected(null) }}>
              Cancel
            </Button>
            : <ButtonTooltip title='Add a new Folder' onClick={() => setForm(true)}>
              Add Folder
            </ButtonTooltip>}
        </div>
      </div>

      <CardContent>
        <>
          {form
            ? <AddFolder setForm={() => setForm(false)} setReload={setReload} folderId={selected?.folder_id} />
            : <div className="space-y-2">
              {filteredGroups.map((group) => {
                const latest = group.files[0];
                const isExpanded = expanded[group.folder_id];
                const isDraggedOver = dragOver === group.folder_id;
                const isUploading = uploadingFor === group.folder_id;
                const isRefreshing = refreshingFolder === group.folder_id;

                return (
                  <Card
                    key={group.folder_id}
                    className={`p-4 border rounded-xl shadow-sm transition-all ${
                      isDraggedOver 
                        ? 'border-blue-500 bg-blue-50 border-2' 
                        : 'border-gray-200 bg-white'
                    } ${isUploading ? 'opacity-60' : ''}`}
                    onDragOver={(e) => handleDragOver(e, group.folder_id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, group.folder_id)}
                  >
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[group.folder_id] = el; }}
                      onChange={(e) => handleFileInputChange(e, group.folder_id)}
                      accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                      className="hidden"
                    />

                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [group.folder_id]: !isExpanded,
                            }))
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <span className="font-semibold">{group.folder_name.replace(/_/g, " ")}</span> • <span className="text-sm">({group.org_name})</span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          ({group.files.length} versions)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Upload Button */}
                        <Button
                          size="sm"
                          variant='ghost'
                          onClick={() => handleButtonClick(group.folder_id)}
                          disabled={isUploading || isRefreshing}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-1" />
                              Upload
                            </>
                          )}
                        </Button>

                        {/* Download Latest Button */}
                        {latest && (
                          <Button
                            asChild
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <a
                              href={`/api/uploads/${encodeURIComponent(latest.identifier)}/download`}
                              download
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Latest
                            </a>
                          </Button>
                        )}

                         <Button
                          size="sm"
                          variant='ghost'
                          onClick={() => refreshFolder(group.folder_id)}
                          disabled={isRefreshing || isUploading}
                          title="Refresh folder"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Upload Progress Indicator */}
                    {isUploading && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <p className="text-sm text-blue-700 font-medium">Uploading file...</p>
                        </div>
                      </div>
                    )}

                    {/* Drag & Drop Indicator */}
                    {isDraggedOver && !isUploading && (
                      <div className="mt-3 p-4 border-2 border-dashed border-blue-500 rounded-lg bg-blue-50 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-600 font-medium">Drop file here to upload</p>
                      </div>
                    )}

                    {/* Iterations List */}
                    {isExpanded && (
                      <div className="mt-4 space-y-2">
                        {group.files.map((it: DataFile, index: number) => (
                          <div
                            key={it.identifier}
                            className="flex items-center justify-between px-3 py-2 rounded-md border hover:bg-gray-50 transition"
                          >
                            <div className="flex flex-col text-sm">
                              <span className="font-medium text-gray-800">
                                Iteration #{group.files.length - index}
                              </span>
                              <span className="text-gray-500 text-xs">
                                {it.file_name} • {formatDateTime(it.created_on)} • {formatFileSize(it.file_size)}
                              </span>
                            </div>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <a
                                href={`/api/uploads/${encodeURIComponent(it.identifier)}/download`}
                                download
                              >
                                <Download className="w-4 h-4" /> Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
              {filteredGroups.length === 0 && (
                <p className="text-gray-500 text-sm italic">
                  No folders match your search.
                </p>
              )}
            </div>}
        </>
      </CardContent>
    </Container>
  );
}
