"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Folder } from "@/lib/repositories/dataRepository";
import type { FolderPermissions } from "@/lib/repositories/dataRepository";
import { Container } from "@/components/ui/container";
import { getEmployeeList } from "@/lib/actions/user";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface FolderPermission {
  userId: string;
  userName: string;
  userEmail: string;
  permissions: FolderPermissions;
  inherited?: boolean;
}

interface FolderPermissionsProps {
  folder: Folder;
  onClose: () => void;
  onUpdate: () => void;
}

export default function FolderPermissions({ folder, onClose, onUpdate }: FolderPermissionsProps) {
  const [permissions, setPermissions] = useState<FolderPermission[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FolderPermission | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const res = await getEmployeeList()

      if (res.success) {
        setAvailableUsers(res.result);
      } else {
        setAvailableUsers([]);
      }

      setLoading(false);
    };

    loadData();
  }, [folder]);

  const filteredUsers = availableUsers.filter(user =>
    !permissions.find(p => p.userId === user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addUserPermission = (user: User) => {
    const newPermission: FolderPermission = {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      permissions: {
        can_create_subfolder: false,
        can_upload_file: false,
        can_download_file: false,
        can_rename: false,
        can_delete: false,
      }
    };
    setPermissions(prev => [...prev, newPermission]);
    setSearchTerm("");
  };

  const removeUserPermission = (userId: string) => {
    setPermissions(prev => prev.filter(p => p.userId !== userId));
    setSelectedUser(null);
    setMobileSheetOpen(false);
  };

  const updatePermission = (userId: string, permissionKey: keyof FolderPermissions, value: boolean) => {
    setPermissions(prev => prev.map(p =>
      p.userId === userId
        ? { ...p, permissions: { ...p.permissions, [permissionKey]: value } }
        : p
    ));
  };

  const savePermissions = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      onUpdate();
      onClose();
    }, 1000);
  };

  const getAvatarFallback = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const openMobilePermissions = (permission: FolderPermission) => {
    setSelectedUser(permission);
    setMobileSheetOpen(true);
  };

  const PermissionToggle = ({ 
    permission, 
    permissionKey, 
    label 
  }: { 
    permission: FolderPermission; 
    permissionKey: keyof FolderPermissions;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <Label htmlFor={`${permissionKey}-${permission.userId}`} className="text-sm font-medium flex-1">
        {label}
      </Label>
      <Switch
        id={`${permissionKey}-${permission.userId}`}
        checked={permission.permissions[permissionKey]}
        onCheckedChange={(checked) =>
          updatePermission(permission.userId, permissionKey, checked)
        }
      />
    </div>
  );

  const PermissionCard = ({ permission }: { permission: FolderPermission }) => (
    <div className="flex items-center gap-3 p-4 border rounded-lg bg-white">
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
          {getAvatarFallback(permission.userName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{permission.userName}</div>
        <div className="text-xs text-gray-500 truncate">{permission.userEmail}</div>
        
        {/* Mobile: Permission badges */}
        <div className="flex flex-wrap gap-1 mt-2 md:hidden">
          {permission.permissions.can_upload_file && (
            <Badge variant="secondary" className="text-xs">Upload</Badge>
          )}
          {permission.permissions.can_download_file && (
            <Badge variant="secondary" className="text-xs">Download</Badge>
          )}
          {permission.permissions.can_create_subfolder && (
            <Badge variant="secondary" className="text-xs">Create</Badge>
          )}
          {permission.permissions.can_rename && (
            <Badge variant="secondary" className="text-xs">Rename</Badge>
          )}
          {permission.permissions.can_delete && (
            <Badge variant="secondary" className="text-xs">Delete</Badge>
          )}
          {Object.values(permission.permissions).every(v => !v) && (
            <Badge variant="outline" className="text-xs">No Access</Badge>
          )}
        </div>
      </div>

      {/* Desktop: Permission toggles */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <Label htmlFor={`upload-${permission.userId}`} className="text-xs">
              Upload
            </Label>
            <Switch
              id={`upload-${permission.userId}`}
              checked={permission.permissions.can_upload_file}
              onCheckedChange={(checked) =>
                updatePermission(permission.userId, 'can_upload_file', checked)
              }
              className="scale-90"
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <Label htmlFor={`download-${permission.userId}`} className="text-xs">
              Download
            </Label>
            <Switch
              id={`download-${permission.userId}`}
              checked={permission.permissions.can_download_file}
              onCheckedChange={(checked) =>
                updatePermission(permission.userId, 'can_download_file', checked)
              }
              className="scale-90"
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <Label htmlFor={`create-${permission.userId}`} className="text-xs">
              Create
            </Label>
            <Switch
              id={`create-${permission.userId}`}
              checked={permission.permissions.can_create_subfolder}
              onCheckedChange={(checked) =>
                updatePermission(permission.userId, 'can_create_subfolder', checked)
              }
              className="scale-90"
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <Label htmlFor={`rename-${permission.userId}`} className="text-xs">
              Rename
            </Label>
            <Switch
              id={`rename-${permission.userId}`}
              checked={permission.permissions.can_rename}
              onCheckedChange={(checked) =>
                updatePermission(permission.userId, 'can_rename', checked)
              }
              className="scale-90"
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            <Label htmlFor={`delete-${permission.userId}`} className="text-xs">
              Delete
            </Label>
            <Switch
              id={`delete-${permission.userId}`}
              checked={permission.permissions.can_delete}
              onCheckedChange={(checked) =>
                updatePermission(permission.userId, 'can_delete', checked)
              }
              className="scale-90"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeUserPermission(permission.userId)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile: More options button */}
      <div className="md:hidden flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openMobilePermissions(permission)}
          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Container className="h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Folder Permissions
              </CardTitle>
              <CardDescription className="truncate">
                Manage user permissions for "{folder.folder_name.replace(/_/g, " ")}"
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {/* Add User Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg">Add User</CardTitle>
                    <CardDescription className="text-sm">
                      Search and add users to assign folder permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>

                    {searchTerm && filteredUsers.length > 0 && (
                      <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-48 md:max-h-60 overflow-auto">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => addUserPermission(user)}
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {getAvatarFallback(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{user.name}</div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Permissions List */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg">
                      User Permissions ({permissions.length})
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Manage individual user access rights for this folder
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {permissions.length === 0 ? (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm md:text-base">No users added yet</p>
                        <p className="text-xs md:text-sm">Add users to assign permissions</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {permissions.map((permission) => (
                          <PermissionCard key={permission.userId} permission={permission} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Permission Presets */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg">Quick Presets</CardTitle>
                    <CardDescription className="text-sm">
                      Apply common permission sets quickly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissions(prev => prev.map(p => ({
                            ...p,
                            permissions: {
                              can_create_subfolder: false,
                              can_upload_file: false,
                              can_download_file: true,
                              can_rename: false,
                              can_delete: false,
                            }
                          })));
                        }}
                        className="flex-1 justify-center text-xs sm:text-sm"
                      >
                        View Only
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissions(prev => prev.map(p => ({
                            ...p,
                            permissions: {
                              can_create_subfolder: true,
                              can_upload_file: true,
                              can_download_file: true,
                              can_rename: false,
                              can_delete: false,
                            }
                          })));
                        }}
                        className="flex-1 justify-center text-xs sm:text-sm"
                      >
                        Contributor
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissions(prev => prev.map(p => ({
                            ...p,
                            permissions: {
                              can_create_subfolder: true,
                              can_upload_file: true,
                              can_download_file: true,
                              can_rename: true,
                              can_delete: true,
                            }
                          })));
                        }}
                        className="flex-1 justify-center text-xs sm:text-sm"
                      >
                        Full Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              {permissions.length} user{permissions.length !== 1 ? 's' : ''} with permissions
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button variant="outline" onClick={onClose} size="sm" className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={savePermissions} disabled={saving} size="sm" className="flex-1 sm:flex-none">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Container>

      {/* Mobile Permission Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          {selectedUser && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getAvatarFallback(selectedUser.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg truncate">{selectedUser.userName}</SheetTitle>
                    <SheetDescription className="truncate">{selectedUser.userEmail}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="py-4">
                <div className="space-y-1">
                  <PermissionToggle 
                    permission={selectedUser} 
                    permissionKey="can_upload_file" 
                    label="Upload Files" 
                  />
                  <PermissionToggle 
                    permission={selectedUser} 
                    permissionKey="can_download_file" 
                    label="Download Files" 
                  />
                  <PermissionToggle 
                    permission={selectedUser} 
                    permissionKey="can_create_subfolder" 
                    label="Create Subfolders" 
                  />
                  <PermissionToggle 
                    permission={selectedUser} 
                    permissionKey="can_rename" 
                    label="Rename Items" 
                  />
                  <PermissionToggle 
                    permission={selectedUser} 
                    permissionKey="can_delete" 
                    label="Delete Items" 
                  />
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeUserPermission(selectedUser.userId)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove User
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}