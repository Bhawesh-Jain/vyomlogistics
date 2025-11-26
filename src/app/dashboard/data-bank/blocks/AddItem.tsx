'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "@/app/dashboard/loading";
import { DefaultFormTextField, DefaultFormSelect, DefaultFormDatePicker } from "@/components/ui/default-form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Building2, Calendar } from "lucide-react";
import { getAllOrganizations } from "@/lib/actions/organizations";
import { Folder } from "@/lib/repositories/dataRepository";
import { Organization } from "@/lib/repositories/organizationRepository";
import { addFolder, getFolderById, getFolderList, updateFolder } from "@/lib/actions/data-bank";
import { FileTransfer } from "@/lib/helpers/file-helper";

const formSchema = z.object({
  folder_name: z.string().min(1, 'Enter folder name'),
  parent_id: z.string().optional(),
  status: z.enum(['1', '0']).default('1')
});

export type FolderFormValues = z.infer<typeof formSchema>;

export default function AddFolder({
  setForm,
  setReload,
  folderId,
  parentId
}: {
  setForm: (form: boolean) => void,
  setReload: (reload: boolean) => void,
  folderId?: number | null,
  parentId?: number | null,
}) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [folderData, setFolderData] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const { toast } = useToast();

  console.log(parentId);


  const form = useForm<FolderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      folder_name: '',
      status: '1'
    },
  });


  useEffect(() => {
    (async () => {
      setDataLoading(true);
      const folderRes = await getFolderList(true);
      form.reset();

      if (folderRes.success) {
        const formattedData = folderRes.result
          .filter((item: Folder) => item.folder_id !== folderId)
          .map((item: Folder) => ({
            label: item.folder_name,
            value: item.folder_id.toString(),
          }));

        setFolders(formattedData);
        if (parentId) {
          form.reset({
            folder_name: '',
            parent_id: String(parentId) ?? '',
            status: '1'
          });
        }
      }

      if (folderId) {
        try {
          const result = await getFolderById(folderId);

          if (result.success) {
            const folder = result.result;
            setFolderData(folder);

            form.reset({
              folder_name: folder.folder_name ?? '',
              parent_id: String(folder.parent_id) ?? '',
              status: folder.status?.toString() ?? '1'
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Folder not found",
              variant: "destructive"
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error?.message || "Failed to fetch folder data",
            variant: "destructive"
          });
        } 
      }

      setDataLoading(false);
    })();
  }, []);

  async function onSubmit(data: FolderFormValues) {
    setLoading(true);
    try {
      const result = folderId
        ? await updateFolder(folderId, data)
        : await addFolder(data);

      if (result.success) {
        toast({
          title: "Request Successful",
          description: folderId ? "Folder updated successfully!" : "Folder added successfully!",
        });
        form.reset();
        setForm(false);
        setReload(true);
      } else {
        toast({
          title: "Error",
          description: result.error || "Operation failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {loading || dataLoading ? (
        <Loading />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Folder Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" /> Folder Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DefaultFormSelect
                  form={form}
                  name="parent_id"
                  label="Parent Folder"
                  placeholder="Choose a parent folder"
                  options={folders}
                />
                <DefaultFormTextField
                  form={form}
                  name="folder_name"
                  label="Folder name"
                  placeholder="Enter folder name"
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {folderId ? "Update Folder" : "Add Folder"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}