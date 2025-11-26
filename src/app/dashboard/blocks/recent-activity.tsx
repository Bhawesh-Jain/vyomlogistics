// app/dashboard/blocks/recent-activity.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  UserPlus, 
  Warehouse,
  Upload,
  Clock
} from 'lucide-react';
import { RecentActivity } from '@/lib/repositories/miscRepository';

interface RecentActivityProps {
  activities: RecentActivity[];
}

export function RecentActivityPage({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'agreement':
        return <FileText className="h-4 w-4" />;
      case 'organization':
        return <UserPlus className="h-4 w-4" />;
      case 'godown':
        return <Warehouse className="h-4 w-4" />;
      case 'upload':
        return <Upload className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'agreement':
        return 'text-blue-600 bg-blue-50';
      case 'organization':
        return 'text-green-600 bg-green-50';
      case 'godown':
        return 'text-orange-600 bg-orange-50';
      case 'upload':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>No recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Activity will appear here as you use the system</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                  <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}