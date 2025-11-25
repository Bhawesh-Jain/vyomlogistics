"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Key,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Folder } from "@/lib/repositories/dataRepository";
import type { FolderPermissions } from "@/lib/repositories/dataRepository";
import { Container } from "@/components/ui/container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEmployeeList } from "@/lib/actions/user";

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

  return (
    <Container>
      <ScrollArea>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Folder Permissions
              </CardTitle>
              <CardDescription>
                Manage user permissions for "{folder.folder_name.replace(/_/g, " ")}"
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Add User Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add User</CardTitle>
                    <CardDescription>
                      Search and add users to assign folder permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {searchTerm && filteredUsers.length > 0 && (
                      <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-60 overflow-auto">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => addUserPermission(user)}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {getAvatarFallback(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Permissions List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      User Permissions ({permissions.length})
                    </CardTitle>
                    <CardDescription>
                      Manage individual user access rights for this folder
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {permissions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No users added yet</p>
                        <p className="text-sm">Add users to assign permissions</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {permissions.map((permission) => (
                          <div key={permission.userId} className="flex items-center gap-4 p-4 border rounded-lg">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getAvatarFallback(permission.userName)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{permission.userName}</div>
                              <div className="text-sm text-gray-500 truncate">{permission.userEmail}</div>
                            </div>

                            <div className="flex items-center gap-6">
                              {/* Permission Toggles */}
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
                                  />
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeUserPermission(permission.userId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Permission Presets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Presets</CardTitle>
                    <CardDescription>
                      Apply common permission sets quickly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
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
                      >
                        Full Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              {permissions.length} user{permissions.length !== 1 ? 's' : ''} with permissions
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={savePermissions} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Container>
  );
}