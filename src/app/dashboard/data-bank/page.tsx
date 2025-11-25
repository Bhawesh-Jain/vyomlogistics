"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Loader2,
  Download,
  ChevronDown,
  ChevronRight,
  Upload,
  RefreshCw,
  Search,
  Folder as FolderIcon,
  File as FileIcon,
  Plus,
  MoreVertical,
  Grid3X3,
  List,
  SortAsc,
  X,
  Home,
  Users,
  Key,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { getFolderList, uploadDataFile, getFolderById } from "@/lib/actions/data-bank";
import { DataFile, Folder } from "@/lib/repositories/dataRepository";
import { FileTransfer } from "@/lib/helpers/file-helper";
import { formatDateTime } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils";
import AddFolder from "./blocks/AddItem";
import { useGlobalDialog } from "@/providers/DialogProvider";
import FolderPermissions from "./blocks/FolderPermissions";
import { ScrollBar } from "@/components/ui/scroll-area";

type ExpandMap = Record<number, boolean>;
type ViewMode = "grid" | "list";
type SortBy = "name" | "date" | "size";
type ActiveView = "files" | "add-folder" | "permissions";

export default function DataBankModern() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderCache, setFolderCache] = useState<Record<number, Folder>>({});

  const [expanded, setExpanded] = useState<ExpandMap>({});
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<ActiveView>("files");
  const [parentFolderId, setParentFolderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<number | null>(null);
  const [refreshingFolder, setRefreshingFolder] = useState<number | null>(null);
  const [loadingFolderDetails, setLoadingFolderDetails] = useState<number | null>(null);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const { showError, showSuccess } = useGlobalDialog();

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await getFolderList();
      if (resp.success) {
        setFolders(resp.result);
        const cache: Record<number, Folder> = {};
        const cacheFolders = (folderList: Folder[]) => {
          folderList.forEach(folder => {
            cache[folder.folder_id] = folder;
            if (folder.sub_folders) {
              cacheFolders(folder.sub_folders);
            }
          });
        };
        cacheFolders(resp.result);
        setFolderCache(cache);

        if (!selectedFolderId && resp.result.length > 0) {
          setSelectedFolderId(resp.result[0].folder_id);
        }
      } else {
        showError("Failed to load folders", "");
      }
    } catch (err) {
      showError("Unexpected error while loading folders", "");
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const selectFolder = useCallback(async (id: number) => {
    setSelectedFolderId(id);
    setActiveView("files");
    setMobileSidebarOpen(false);

    const cachedFolder = folderCache[id];
    if (cachedFolder && cachedFolder.files && cachedFolder.files.length > 0) {
      return;
    }

    try {
      setLoadingFolderDetails(id);
      const resp = await getFolderById(id);
      if (resp.success) {
        const updatedFolder = resp.result as Folder;

        setFolderCache(prev => ({
          ...prev,
          [id]: updatedFolder
        }));

        const updateInTree = (items: Folder[]): Folder[] =>
          items.map((f) => {
            if (f.folder_id === id) return { ...updatedFolder };
            if (f.sub_folders && f.sub_folders.length) {
              return { ...f, sub_folders: updateInTree(f.sub_folders) };
            }
            return f;
          });

        setFolders(prev => updateInTree(prev));
      }
    } catch (err) {
      showError("Failed to load folder details", "");
    } finally {
      setLoadingFolderDetails(null);
    }
  }, [folderCache]);

  const findFolderById = useCallback((id: number | null, collection = folders): Folder | null => {
    if (id == null) return null;
    const stack = [...collection];
    while (stack.length) {
      const f = stack.shift()!;
      if (f.folder_id === id) return f;
      if (f.sub_folders && f.sub_folders.length) stack.push(...f.sub_folders);
    }
    return null;
  }, [folders]);

  const getBreadcrumbPath = useCallback((folderId: number | null): Folder[] => {
    if (!folderId) return [];

    const path: Folder[] = [];
    const findPath = (items: Folder[], targetId: number): boolean => {
      for (const folder of items) {
        if (folder.folder_id === targetId) {
          path.unshift(folder);
          return true;
        }
        if (folder.sub_folders && findPath(folder.sub_folders, targetId)) {
          path.unshift(folder);
          return true;
        }
      }
      return false;
    };

    findPath(folders, folderId);
    return path;
  }, [folders]);

  const refreshFolder = useCallback(async (folderId: number) => {
    try {
      setRefreshingFolder(folderId);
      const resp = await getFolderById(folderId);
      if (!resp.success) {
        showError("Failed to refresh folder", "");
        return;
      }
      const updated = resp.result as Folder;

      setFolderCache(prev => ({
        ...prev,
        [folderId]: updated
      }));

      const replace = (items: Folder[]): Folder[] =>
        items.map((f) => {
          if (f.folder_id === folderId) return { ...updated };
          if (f.sub_folders && f.sub_folders.length) {
            return { ...f, sub_folders: replace(f.sub_folders) };
          }
          return f;
        });

      setFolders((prev) => replace(prev));
      showSuccess("Folder refreshed", "");
    } catch (err) {
      showError("Unexpected error while refreshing", "");
    } finally {
      setRefreshingFolder(null);
    }
  }, [showError, showSuccess]);

  const uploadFile = useCallback(async (folderId: number, file: File) => {
    try {
      setUploadingFor(folderId);

      const folder = folderCache[folderId];
      if (folder && !folder.permissions?.can_upload_file) {
        showError("You don't have permission to upload files to this folder", "");
        return;
      }

      const isValidExt = /\.(xlsx?|csv)$/i.test(file.name);
      if (!isValidExt) {
        showError("Only Excel/CSV files are allowed", "");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError("File must be smaller than 10MB", "");
        return;
      }

      const data: FileTransfer = {
        name: file.name,
        type: file.type,
        arrayBuffer: Array.from(new Uint8Array(await file.arrayBuffer())),
      };

      const resp = await uploadDataFile(folderId, data);
      if (resp.success) {
        await refreshFolder(folderId);
        showSuccess("File uploaded successfully", "");
      } else {
        showError("Upload failed", "");
      }
    } catch (err) {
      showError("Unexpected error while uploading", "");
    } finally {
      setUploadingFor(null);
    }
  }, [refreshFolder, showError, showSuccess, folderCache]);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, folderId: number) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(folderId, file);
    e.target.value = "";
  }, [uploadFile]);

  const matchesSearch = useCallback((folder: Folder, term: string): boolean => {
    const t = term.trim().toLowerCase();
    if (!t) return true;
    if (folder.folder_name.toLowerCase().includes(t)) return true;
    if (folder.org_name?.toLowerCase().includes(t)) return true;
    if (folder.files.some((f) => f.file_name.toLowerCase().includes(t))) return true;
    if (folder.sub_folders?.some((sf) => matchesSearch(sf, t))) return true;
    return false;
  }, []);

  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folders;
    return folders.filter((f) => matchesSearch(f, searchTerm));
  }, [folders, searchTerm, matchesSearch]);

  const toggleExpand = useCallback((id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const openFileInput = useCallback((folderId: number) => {
    fileInputRefs.current[folderId]?.click();
  }, []);

  const handleAddSubfolder = useCallback((folderId: number) => {
    setParentFolderId(folderId);
    setActiveView("add-folder");
  }, []);

  const handleAddRootFolder = useCallback(() => {
    setParentFolderId(null);
    setActiveView("add-folder");
  }, []);

  const handleOpenPermissions = useCallback((folderId: number) => {
    setSelectedFolderId(folderId);
    setActiveView("permissions");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    setDragOverFolder(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(folderId, e.dataTransfer.files[0]);
    }
  }, [uploadFile]);

  const FolderNameWithTooltip = useCallback(({ folder, className = "" }: { folder: Folder; className?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`truncate ${className}`}>
          {folder.folder_name.replace(/_/g, " ")}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{folder.folder_name.replace(/_/g, " ")}</p>
        {folder.org_name && <p className="text-xs text-gray-400">{folder.org_name}</p>}
      </TooltipContent>
    </Tooltip>
  ), []);

  const TreeItem = useCallback(({ folder, depth = 0 }: { folder: Folder; depth?: number }) => {
    const isExpanded = !!expanded[folder.folder_id];
    const isSelected = folder.folder_id === selectedFolderId;
    const hasChildren = folder.sub_folders && folder.sub_folders.length > 0;
    const isUploading = uploadingFor === folder.folder_id;
    const isDragging = dragOverFolder === folder.folder_id;
    const isLoadingDetails = loadingFolderDetails === folder.folder_id;

    return (
      <div key={folder.folder_id} className="group">
        <div
          onClick={() => selectFolder(folder.folder_id)}
          onKeyDown={(e) => { if (e.key === "Enter") selectFolder(folder.folder_id); }}
          role="button"
          tabIndex={0}
          className={`flex items-center justify-between gap-2 cursor-pointer rounded-lg px-3 py-2 transition-all duration-200 mb-1
            ${isSelected ? "bg-blue-50 border border-blue-200 shadow-sm" : "hover:bg-gray-50 border border-transparent"}
            ${isDragging ? "border-dashed border-blue-300 bg-blue-25" : ""}`}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1">
              {hasChildren ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleExpand(folder.folder_id); }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {isExpanded ?
                    <ChevronDown className="w-4 h-4 text-gray-600" /> :
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  }
                </button>
              ) : (
                <span className="w-6 h-6" />
              )}
            </div>

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-lg ${isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                }`}>
                <FolderIcon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FolderNameWithTooltip
                    folder={folder}
                    className="text-sm font-semibold text-gray-900"
                  />
                  {isLoadingDetails && (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate flex items-center gap-2 mt-1">
                  <span>{folder.org_name || folder.company_name || ""}</span>
                  <span>•</span>
                  <span>{folder.files.length} files</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {folder.permissions?.can_create_subfolder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddSubfolder(folder.folder_id); }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Add subfolder</TooltipContent>
              </Tooltip>
            )}

            {folder.permissions?.can_upload_file && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => { e.stopPropagation(); openFileInput(folder.folder_id); }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {isUploading ?
                      <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> :
                      <Upload className="w-4 h-4 text-gray-600" />
                    }
                  </button>
                </TooltipTrigger>
                <TooltipContent>Upload file</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); refreshFolder(folder.folder_id); }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshingFolder === folder.folder_id ? "animate-spin" : ""
                    }`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Refresh folder</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenPermissions(folder.folder_id); }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-4 h-4 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Manage permissions</TooltipContent>
            </Tooltip>
          </div>

          <input
            type="file"
            ref={(el) => { (fileInputRefs.current[folder.folder_id] = el) }}
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => onFileInputChange(e, folder.folder_id)}
          />
        </div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {folder.sub_folders!.map((child) => (
                <TreeItem key={child.folder_id} folder={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    expanded, selectedFolderId, uploadingFor, dragOverFolder, refreshingFolder,
    loadingFolderDetails, toggleExpand, selectFolder, openFileInput, refreshFolder,
    onFileInputChange, handleAddSubfolder, handleOpenPermissions, FolderNameWithTooltip
  ]);

  const selectedFolder = useMemo(() => findFolderById(selectedFolderId), [findFolderById, selectedFolderId]);
  const breadcrumbPath = useMemo(() => getBreadcrumbPath(selectedFolderId), [getBreadcrumbPath, selectedFolderId]);
  const latestFile = selectedFolder?.files?.[0] || null;

  const sortedFiles = useMemo(() => {
    if (!selectedFolder?.files) return [];

    const files = [...selectedFolder.files];
    switch (sortBy) {
      case "name":
        return files.sort((a, b) => a.file_name.localeCompare(b.file_name));
      case "size":
        return files.sort((a, b) => (Number(b.file_size) || 0) - (Number(a.file_size) || 0));
      case "date":
      default:
        return files.sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());
    }
  }, [selectedFolder, sortBy]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return sortedFiles;
    const term = searchTerm.toLowerCase();
    return sortedFiles.filter((f) => f.file_name.toLowerCase().includes(term));
  }, [sortedFiles, searchTerm]);

  const canUploadToSelected = selectedFolder?.permissions?.can_upload_file ?? false;
  const canDownloadFromSelected = selectedFolder?.permissions?.can_download_file ?? false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Loading Data Bank</p>
          <p className="text-sm text-gray-500">Getting your folders ready...</p>
        </div>
      </div>
    );
  }

  const renderFilesView = () => (
    <>
      {canUploadToSelected && (
        <div
          onDragOver={(e) => handleDragOver(e, selectedFolder!.folder_id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, selectedFolder!.folder_id)}
          className={`rounded-xl border-2 border-dashed p-4 md:p-8 mb-6 text-center transition-all ${dragOverFolder === selectedFolder!.folder_id
            ? "border-blue-400 bg-blue-25 border-solid"
            : "border-gray-300 hover:border-gray-400"
            }`}
        >
          <Upload className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-semibold mb-2">Drop files here</h3>
          <p className="text-gray-500 text-sm md:text-base mb-4">
            Upload Excel or CSV files up to 10MB
          </p>
          <Button
            onClick={() => openFileInput(selectedFolder!.folder_id)}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            Select Files
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-lg">Files ({filteredFiles.length})</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-2 sm:px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-2 sm:px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-sm">
                <SortAsc className="w-4 h-4" />
                <span className="hidden sm:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                By Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                By Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("size")}>
                By Size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <FileIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500 text-sm md:text-base mb-4">
            {searchTerm ? "Try adjusting your search" : "Get started by uploading your first file"}
          </p>
          {canUploadToSelected && (
            <Button 
              onClick={() => openFileInput(selectedFolder!.folder_id)} 
              size="sm"
              className="text-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredFiles.map((file, index) => (
            <FileCard
              key={file.identifier}
              file={file}
              version={filteredFiles.length - index}
              canDownload={canDownloadFromSelected}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file, index) => (
            <FileRow
              key={file.identifier}
              file={file}
              version={filteredFiles.length - index}
              canDownload={canDownloadFromSelected}
            />
          ))}
        </div>
      )}
    </>
  );

  const renderContentItems = () => {
    const allItems = [
      ...(selectedFolder?.sub_folders?.map(folder => ({ type: 'folder', data: folder })) || []),
      ...(selectedFolder?.files?.map(file => ({ type: 'file', data: file })) || [])
    ];

    if (allItems.length === 0) {
      return (
        <div className="text-center py-8 md:py-12">
          <FolderIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Empty folder</h3>
          <p className="text-gray-500 text-sm md:text-base mb-4">
            This folder doesn't contain any files or subfolders
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {selectedFolder?.permissions?.can_create_subfolder && (
              <Button 
                onClick={() => handleAddSubfolder(selectedFolder.folder_id)} 
                size="sm"
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subfolder
              </Button>
            )}
            {canUploadToSelected && (
              <Button 
                onClick={() => openFileInput(selectedFolder!.folder_id)} 
                variant="outline" 
                size="sm"
                className="text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allItems.map((item) => {
          if (item.type === 'folder') {
            const folder = item.data as Folder;
            return (
              <div
                key={`folder-${folder.folder_id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 group transition-colors cursor-pointer"
                onClick={() => selectFolder(folder.folder_id)}
              >
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                  <FolderIcon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                    <h4 className="font-semibold text-sm truncate">{folder.folder_name.replace(/_/g, " ")}</h4>
                    <Badge variant="outline" className="text-xs w-fit">Folder</Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                    <span className="truncate">{folder.org_name || folder.company_name || ""}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{folder.files.length} files</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            );
          } else {
            const file = item.data as DataFile;
            const version = filteredFiles.length - filteredFiles.findIndex(f => f.identifier === file.identifier);
            return (
              <FileRow
                key={`file-${file.identifier}`}
                file={file}
                version={version}
                canDownload={canDownloadFromSelected}
              />
            );
          }
        })}
      </div>
    );
  };

  const SidebarContent = () => (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Folders</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto px-3 pb-3">
          {filteredFolders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No folders found</p>
            </div>
          ) : (
            <div>
              {filteredFolders.map((f) => (
                <TreeItem key={f.folder_id} folder={f} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <Container className="py-4 md:py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Data Bank</h1>
              <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Manage and organize your data files</p>
            </div>
          </div>
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          <Button
            onClick={handleAddRootFolder}
            className="bg-blue-600 hover:bg-blue-700 text-sm"
            size="sm"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
        </div>

        <div className="flex gap-4 md:gap-6 h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <SidebarContent />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {selectedFolder ? (
              <>
                <Card className="mb-4 md:mb-6">
                  <CardContent className="pt-4 md:pt-6">
                    <Breadcrumb>
                      <BreadcrumbList className="flex-wrap">
                        <BreadcrumbItem>
                          <BreadcrumbLink
                            href="#"
                            onClick={() => setSelectedFolderId(null)}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Home className="w-3 h-3 md:w-4 md:h-4" />
                            Root
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        {breadcrumbPath.map((folder, index) => (
                          <div key={folder.folder_id} className="flex items-center">
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              {index === breadcrumbPath.length - 1 ? (
                                <span className="font-medium text-gray-900 text-sm">
                                  {folder.folder_name.replace(/_/g, " ")}
                                </span>
                              ) : (
                                <BreadcrumbLink
                                  href="#"
                                  onClick={() => selectFolder(folder.folder_id)}
                                  className="text-gray-600 hover:text-gray-900 text-sm"
                                >
                                  {folder.folder_name.replace(/_/g, " ")}
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                          </div>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </CardContent>
                </Card>

                <Card className="mb-4 md:mb-6">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-blue-100 text-blue-600">
                          <FolderIcon className="w-4 h-4 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg md:text-xl flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="truncate">{selectedFolder.folder_name.replace(/_/g, " ")}</span>
                            <Badge variant="secondary" className="w-fit text-xs">
                              {selectedFolder.files.length} files
                              {selectedFolder.sub_folders && selectedFolder.sub_folders.length > 0 &&
                                `, ${selectedFolder.sub_folders.length} subfolders`
                              }
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 text-xs md:text-sm">
                            <span>{selectedFolder.org_name || selectedFolder.company_name}</span>
                            {latestFile && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span>Last updated {formatDateTime(latestFile.created_on)}</span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {canUploadToSelected && (
                          <Button
                            onClick={() => openFileInput(selectedFolder.folder_id)}
                            disabled={uploadingFor === selectedFolder.folder_id}
                            className="bg-blue-600 hover:bg-blue-700 text-sm"
                            size="sm"
                          >
                            {uploadingFor === selectedFolder.folder_id ? (
                              <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1 md:mr-2" />
                            ) : (
                              <Upload className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                            )}
                            Upload
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => handleOpenPermissions(selectedFolder.folder_id)}
                          size="sm"
                          className="text-sm"
                        >
                          <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                          Permissions
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="px-2">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => refreshFolder(selectedFolder.folder_id)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh
                            </DropdownMenuItem>
                            {selectedFolder.permissions?.can_create_subfolder && (
                              <DropdownMenuItem onClick={() => handleAddSubfolder(selectedFolder.folder_id)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Subfolder
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="flex-1">
                  <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ActiveView)}>
                    <TabsList className="m-2 md:m-3 flex-wrap">
                      <TabsTrigger value="files" className="text-xs md:text-sm">
                        <FileIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        All Content
                      </TabsTrigger>
                      <TabsTrigger value="add-folder" className="text-xs md:text-sm">
                        <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                        Add Folder
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="mt-0 mb-2 md:mb-3 mx-2 md:mx-3 max-h-96 overflow-auto">
                      {renderContentItems()}
                    </TabsContent>

                    <TabsContent value="add-folder" className="mt-0 mb-2 md:mb-3 mx-2 md:mx-3 overflow-auto">
                      <AddFolder
                        setForm={() => {
                          setActiveView("files");
                          setParentFolderId(null);
                          loadFolders();
                        }}
                        setReload={loadFolders}
                        folderId={parentFolderId}
                      />
                    </TabsContent>

                    <TabsContent value="permissions" className="mt-0">
                      <FolderPermissions
                        folder={selectedFolder}
                        onClose={() => setActiveView("files")}
                        onUpdate={loadFolders}
                      />
                    </TabsContent>
                  </Tabs>
                </Card>
              </>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent className="text-center py-12 md:py-16">
                  <FolderIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No folder selected</h3>
                  <p className="text-gray-500 mb-6 text-sm md:text-base">
                    Choose a folder from the sidebar to view its contents
                  </p>
                  <Button onClick={handleAddRootFolder} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Folder
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </TooltipProvider>
  );
}

const FileCard = ({ file, version, canDownload }: { file: DataFile; version: number; canDownload: boolean }) => (
  <Card className="p-3 md:p-4 hover:shadow-md transition-shadow group">
    <div className="flex items-start justify-between mb-2 md:mb-3">
      <div className="p-1 md:p-2 bg-gray-100 rounded-lg">
        <FileIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
      </div>
      {canDownload && (
        <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity p-1 md:p-2">
          <a href={`/api/uploads/${encodeURIComponent(file.identifier)}/download`} download>
            <Download className="w-3 h-3 md:w-4 md:h-4" />
          </a>
        </Button>
      )}
    </div>

    <h4 className="font-semibold text-xs md:text-sm mb-1 md:mb-2 truncate">{file.file_name}</h4>
    <div className="space-y-1 text-xs text-gray-500">
      <div>Version #{version}</div>
      <div>{formatDateTime(file.created_on)}</div>
      <div>{formatFileSize(file.file_size)}</div>
    </div>
  </Card>
);

const FileRow = ({ file, version, canDownload }: { file: DataFile; version: number; canDownload: boolean }) => (
  <div className="flex items-center gap-3 p-2 md:p-3 rounded-lg border hover:bg-gray-50 group transition-colors">
    <div className="p-1 md:p-2 bg-gray-100 rounded-lg flex-shrink-0">
      <FileIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
        <h4 className="font-semibold text-sm truncate">{file.file_name}</h4>
        <Badge variant="outline" className="text-xs w-fit">v{version}</Badge>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
        <span>{formatDateTime(file.created_on)}</span>
        <span className="hidden sm:inline">•</span>
        <span>{formatFileSize(file.file_size)}</span>
      </div>
    </div>

    {canDownload && (
      <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity p-1 md:p-2 flex-shrink-0">
        <a href={`/api/uploads/${encodeURIComponent(file.identifier)}/download`} download>
          <Download className="w-3 h-3 md:w-4 md:h-4" />
        </a>
      </Button>
    )}
  </div>
);