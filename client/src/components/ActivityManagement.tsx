
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Plus,
  Search,
  Edit,
  Clock,
  MapPin,
  Users,
  Camera,
  Activity as ActivityIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { 
  Activity, 
  CreateActivityInput,
  UpdateActivityInput, 
  UserRole,
  ActivityType
} from '../../../server/src/schema';

interface ActivityManagementProps {
  currentUser: {
    id: number;
    full_name: string;
    role: UserRole;
    email: string;
  };
}

export function ActivityManagement({ currentUser }: ActivityManagementProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'ongoing' | 'completed' | 'cancelled'>('all');
  
  // Date range for filtering activities
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  );

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreateActivityInput>({
    title: '',
    description: null,
    type: 'harian',
    scheduled_date: new Date(),
    end_date: null,
    location: null,
    participants: null,
    photos: null,
    created_by: currentUser.id,
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateActivityInput>>({});

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getActivitiesByDateRange.query({
        start_date: startDate,
        end_date: endDate,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setActivities(result);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, typeFilter]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newActivity = await trpc.createActivity.mutate(createFormData);
      setActivities((prev: Activity[]) => [...prev, newActivity]);
      setIsCreateDialogOpen(false);
      setCreateFormData({
        title: '',
        description: null,
        type: 'harian',
        scheduled_date: new Date(),
        end_date: null,
        location: null,
        participants: null,
        photos: null,
        created_by: currentUser.id,
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    
    setIsSubmitting(true);
    
    try {
      const updateData = {
        id: editingActivity.id,
        ...editFormData,
      };
      
      const updatedActivity = await trpc.updateActivity.mutate(updateData);
      setActivities((prev: Activity[]) => 
        prev.map(activity => activity.id === editingActivity.id ? updatedActivity : activity)
      );
      setIsEditDialogOpen(false);
      setEditingActivity(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setEditFormData({
      title: activity.title,
      description: activity.description,
      type: activity.type,
      scheduled_date: activity.scheduled_date,
      end_date: activity.end_date,
      location: activity.location,
      participants: activity.participants,
      photos: activity.photos,
      status: activity.status,
    });
    setIsEditDialogOpen(true);
  };

  const getTypeLabel = (type: ActivityType) => {
    const labels: Record<ActivityType, string> = {
      harian: '📅 Harian',
      mingguan: '📆 Mingguan',
      bulanan: '🗓️ Bulanan',
      khusus: '⭐ Khusus'
    };
    return labels[type];
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string, label: string }> = {
      planned: { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200', label: '📋 Direncanakan' },
      ongoing: { variant: 'default', className: 'bg-orange-100 text-orange-700 border-orange-200', label: '⏳ Berlangsung' },
      completed: { variant: 'default', className: 'bg-green-100 text-green-700 border-green-200', label: '✅ Selesai' },
      cancelled: { variant: 'secondary', className: 'bg-red-100 text-red-700 border-red-200', label: '❌ Dibatalkan' },
    };
    
    const config = variants[status] || variants.planned;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const calculateStats = () => {
    const statusCounts = {
      planned: activities.filter(a => a.status === 'planned').length,
      ongoing: activities.filter(a => a.status === 'ongoing').length,
      completed: activities.filter(a => a.status === 'completed').length,
      cancelled: activities.filter(a => a.status === 'cancelled').length,
    };

    const typeCounts = {
      harian: activities.filter(a => a.type === 'harian').length,
      mingguan: activities.filter(a => a.type === 'mingguan').length,
      bulanan: activities.filter(a => a.type === 'bulanan').length,
      khusus: activities.filter(a => a.type === 'khusus').length,
    };

    return { statusCounts, typeCounts };
  };

  const stats = calculateStats();
  const canManage = currentUser.role === 'admin' || currentUser.role === 'pengurus';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📅 Manajemen Kegiatan</h2>
          <p className="text-gray-600 mt-1">
            Kelola jadwal dan dokumentasi kegiatan panti asuhan
          </p>
        </div>
        
        {canManage && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Buat Kegiatan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Kegiatan Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan kegiatan baru untuk panti asuhan
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateActivity}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="title">Judul Kegiatan *</Label>
                    <Input
                      id="title"
                      value={createFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateActivityInput) => ({ 
                          ...prev, 
                          title: e.target.value 
                        }))
                      }
                      placeholder="Contoh: Kegiatan Belajar Mengaji"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kegiatan *</Label>
                    <Select
                      value={createFormData.type || 'harian'}
                      onValueChange={(value: ActivityType) =>
                        setCreateFormData((prev: CreateActivityInput) => ({ 
                          ...prev, 
                          type: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harian">📅 Harian</SelectItem>
                        <SelectItem value="mingguan">📆 Mingguan</SelectItem>
                        <SelectItem value="bulanan">🗓️ Bulanan</SelectItem>
                        <SelectItem value="khusus">⭐ Khusus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Mulai *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(createFormData.scheduled_date, 'dd MMMM yyyy', { locale: id })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={createFormData.scheduled_date}
                          onSelect={(date: Date | undefined) =>
                            date && setCreateFormData((prev: CreateActivityInput) => ({ 
                              ...prev, 
                              scheduled_date: date 
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Selesai</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {createFormData.end_date ? 
                            format(createFormData.end_date, 'dd MMMM yyyy', { locale: id }) :
                            'Pilih tanggal selesai (opsional)'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={createFormData.end_date || undefined}
                          onSelect={(date: Date | undefined) =>
                            setCreateFormData((prev: CreateActivityInput) => ({ 
                              ...prev, 
                              end_date: date || null 
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasi</Label>
                    <Input
                      id="location"
                      value={createFormData.location || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateActivityInput) => ({ 
                          ...prev, 
                          location: e.target.value || null 
                        }))
                      }
                      placeholder="Contoh: Ruang kelas, Halaman panti"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">Deskripsi Kegiatan</Label>
                    <Textarea
                      id="description"
                      value={createFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateActivityInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Jelaskan detail kegiatan, tujuan, dan agenda"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="participants">Peserta</Label>
                    <Textarea
                      id="participants"
                      value={createFormData.participants || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateActivityInput) => ({ 
                          ...prev, 
                          participants: e.target.value || null 
                        }))
                      }
                      placeholder="Daftar atau kriteria peserta kegiatan"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="photos">URL Foto Kegiatan</Label>
                    <Input
                      id="photos"
                      value={createFormData.photos || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateActivityInput) => ({ 
                          ...prev, 
                          photos: e.target.value || null 
                        }))
                      }
                      placeholder="Link ke foto atau dokumentasi kegiatan"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Buat Kegiatan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Direncanakan</p>
                <p className="text-2xl font-bold text-blue-900">{stats.statusCounts.planned}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Berlangsung</p>
                <p className="text-2xl font-bold text-orange-900">{stats.statusCounts.ongoing}</p>
              </div>
              <ActivityIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Selesai</p>
                <p className="text-2xl font-bold text-green-900">{stats.statusCounts.completed}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Kegiatan</p>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari judul kegiatan..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={(value: 'all' | ActivityType) => setTypeFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="harian">Harian</SelectItem>
                <SelectItem value="mingguan">Mingguan</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
                <SelectItem value="khusus">Khusus</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: 'all' | 'planned' | 'ongoing' | 'completed' | 'cancelled') => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="planned">Direncanakan</SelectItem>
                <SelectItem value="ongoing">Berlangsung</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'dd/MM/yy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date: Date | undefined) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-gray-500 self-center">s/d</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'dd/MM/yy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date: Date | undefined) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Tidak ada kegiatan yang sesuai filter'
                : 'Belum ada kegiatan terjadwal'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Coba ubah kriteria pencarian atau filter'
                : canManage 
                  ? 'Mulai dengan membuat kegiatan pertama'
                  : 'Kegiatan akan muncul di sini'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity: Activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{activity.title}</CardTitle>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(activity.status)}
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(activity.type)}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {format(activity.scheduled_date, 'dd MMMM yyyy', { locale: id })}
                  {activity.end_date && activity.end_date.getTime() !== activity.scheduled_date.getTime() && (
                    <> - {format(activity.end_date, 'dd MMMM yyyy', { locale: id })}</>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {activity.description && (
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {activity.description}
                  </div>
                )}

                {activity.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {activity.location}
                  </div>
                )}

                {activity.participants && (
                  <div className="flex items-start text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 mt-0.5" />
                    <div className="line-clamp-2">{activity.participants}</div>
                  </div>
                )}

                {activity.photos && (
                  <div className="flex items-center text-sm text-blue-600">
                    <Camera className="h-4 w-4 mr-2" />
                    <a 
                      href={activity.photos} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Lihat Foto
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Dibuat: {format(activity.created_at, 'dd/MM/yyyy')}
                  </span>
                  
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(activity)}
                      className="h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingActivity && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Kegiatan</DialogTitle>
              <DialogDescription>
                Perbarui informasi kegiatan {editingActivity.title}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditActivity}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_title">Judul Kegiatan *</Label>
                  <Input
                    id="edit_title"
                    value={editFormData.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        title: e.target.value 
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kegiatan *</Label>
                  <Select
                    value={editFormData.type || 'harian'}
                    onValueChange={(value: ActivityType) =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        type: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harian">📅 Harian</SelectItem>
                      <SelectItem value="mingguan">📆 Mingguan</SelectItem>
                      <SelectItem value="bulanan">🗓️ Bulanan</SelectItem>
                      <SelectItem value="khusus">⭐ Khusus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Kegiatan *</Label>
                  <Select
                    value={editFormData.status || 'planned'}
                    onValueChange={(value: 'planned' | 'ongoing' | 'completed' | 'cancelled') =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        status: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">📋 Direncanakan</SelectItem>
                      <SelectItem value="ongoing">⏳ Berlangsung</SelectItem>
                      <SelectItem value="completed">✅ Selesai</SelectItem>
                      <SelectItem value="cancelled">❌ Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFormData.scheduled_date && format(editFormData.scheduled_date, 'dd MMMM yyyy', { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.scheduled_date}
                        onSelect={(date: Date | undefined) =>
                          date && setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                            ...prev, 
                            scheduled_date: date 
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFormData.end_date ? 
                          format(editFormData.end_date, 'dd MMMM yyyy', { locale: id }) :
                          'Pilih tanggal selesai (opsional)'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.end_date || undefined}
                        onSelect={(date: Date | undefined) =>
                          setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                            ...prev, 
                            end_date: date || null 
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_location">Lokasi</Label>
                  <Input
                    id="edit_location"
                    value={editFormData.location || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        location: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_description">Deskripsi Kegiatan</Label>
                  <Textarea
                    id="edit_description"
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_participants">Peserta</Label>
                  <Textarea
                    id="edit_participants"
                    value={editFormData.participants || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        participants: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_photos">URL Foto Kegiatan</Label>
                  <Input
                    id="edit_photos"
                    value={editFormData.photos || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateActivityInput>) => ({ 
                        ...prev, 
                        photos: e.target.value || null 
                      }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
