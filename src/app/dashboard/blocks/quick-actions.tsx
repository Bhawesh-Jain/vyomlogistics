// app/dashboard/blocks/quick-actions.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileText, 
  Building2, 
  Warehouse,
  Upload,
  Users
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Add Organization',
      description: 'Register new client',
      icon: Building2,
      href: '/organizations/companies/new',
      variant: 'default' as const
    },
    {
      title: 'Create Agreement',
      description: 'New client agreement',
      icon: FileText,
      href: '/organizations/agreements/new',
      variant: 'outline' as const
    },
    {
      title: 'Add Godown',
      description: 'Register new storage space',
      icon: Warehouse,
      href: '/godown/new',
      variant: 'outline' as const
    },
    {
      title: 'Upload Files',
      description: 'To data bank',
      icon: Upload,
      href: '/data-bank',
      variant: 'outline' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Frequently used actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-3 px-4 justify-start"
              asChild
            >
              <a href={action.href}>
                <action.icon className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}