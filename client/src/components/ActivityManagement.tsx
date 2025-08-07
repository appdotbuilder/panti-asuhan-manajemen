
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search,
  Filter,
  MapPin,
  Users,
  Camera,
  Edit,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { Activity, CreateActivityInput, UpdateActivityInput, ActivityType } from '../../../server/src/schema';

interface ActivityManagementProps {
  backendStatus: 'loading' | 'connected' | 'error';
}

export function ActivityManagement({ backendStatus }: ActivityManagementProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state for creating/editing activities
  const [activityFormData, setActivityFormData] = useState<CreateActivityInput>({
    title: '',
    description: null,
    type: 'harian',
    scheduled_date: new Date(),
    end_date: null,
    location: null,
    participants: null,
    photos: null,
    created_by: 1, // TODO: Replace with actual user ID from auth context
  });

  // Load activities for current month
  const loadActivities = useCallback(async () => {
    if (backendStatus === 'error') {
      // Use demo activities data
      const demoActivities: Activity[] = [
        {
          id: 1,
          title: 'Kegiatan Belajar Pagi',
          description: 'Kegiatan belajar rutin untuk anak-anak SD dan SMP',
          type: 'harian',
          scheduled_date: new Date('2024-01-15T07:00:00'),
          end_date: new Date('2024-01-15T09:00: 00'),
          location: 'Ruang Belajar Utama',
          participants: 'Semua anak usia sekolah (15 anak)',
          photos: null,
          status: 'completed',
          created_by: 1,
          created_at: new Date('2024-01-10'),
          updated_at: null,
        },
        {
          id: 2,
          title: 'Kegiatan Olahraga',
          description: 'Senam pagi dan bermain bola',
          type: 'harian',
          scheduled_date: new Date('2024-01-16T06:00:00'),
          end_date: new Date('2024-01-16T07:30:00'),
          location: 'Halaman Belakang',
          participants: 'Semua anak',
          photos: null,
          status: 'completed',
          created_by: 1,
          created_at: new Date('2024-01-10'),
          updated_at: null,
        },
        {
          id: 3,
          title: 'Kunjungan Donor',
          description: 'Penyerahan bantuan dari Ibu Sari Wijaya',
          type: 'khusus',
          scheduled_date: new Date('2024-01-20T10:00:00'),
          end_date: new Date('2024-01-20T12:00:00'),
          location: 'Ruang Tamu',
          participants: 'Pengurus dan 5 anak perwakilan',
          photos: null,
          status: 'planned',
          created_by: 1,
          created_at: new Date('2024-01-15'),
          updated_at: null,
        },
        {
          id: 4,
          title: 'Perayaan Ulang Tahun Ahmad',
          description: 'Perayaan ulang tahun ke-14 Ahmad Rizki',
          type: 'khusus',
          scheduled_date: new Date('2024-01-25T19:00:00'),
          end_date: new Date('2024-01-25T21:00:00'),
          location: 'Ruang Makan',
          participants: 'Semua penghuni panti',
          photos: null,
          status: 'planned',
          created_by: 1,
          created_at: new Date('2024-01-18'),
          updated_at: null,
        },
      ];
      setActivities(demoActivities);
      return;
    }

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const activitiesData = await trpc.getActivitiesByDateRange.query({
        start_date: startOfMonth,
        end_date: endOfMonth,
      });

      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, [backendStatus]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Reset form
  const resetActivityForm = useCallback(() => {
    setActivityFormData({
      title: '',
      description: null,
      type: 'harian',
      scheduled_date: new Date(),
      end_date: null,
      location: null,
      participants: null,
      photos: null,
      created_by: 1,
    });
  }, []);

  // Filter activities
  const filteredActivities = activities.filter((activity: Activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle create activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendStatus === 'error') {
      alert('Mode demo: Data kegiatan tidak dapat disimpan secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trpc.createActivity.mutate(activityFormData);
      setIsAddActivityDialogOpen(false);
      resetActivityForm();
      loadActivities();
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Gagal menambah kegiatan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit activity
  const handleEditActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    if (backendStatus === 'error') {
      alert('Mode demo: Data kegiatan tidak dapat diubah secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }

    setIsLoading(true);
    
    try {
      const updateData: UpdateActivityInput = {
        id: editingActivity.id,
        title: activityFormData.title,
        description: activityFormData.description,
        type: activityFormData.type,
        scheduled_date: activityFormData.scheduled_date,
        end_date: activityFormData.end_date,
        location: activityFormData.location,
        participants: activityFormData.participants,
        photos: activityFormData.photos,
      };
      
      await trpc.updateActivity.mutate(updateData);
      setEditingActivity(null);
      resetActivityForm();
      loadActivities();
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Gagal mengubah kegiatan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (activity: Activity, newStatus: string) => {
    if (backendStatus === 'error') {
      alert('Mode demo: Status kegiatan tidak dapat diubah secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trpc.updateActivity.mutate({
        id: activity.id,
        status: newStatus as 'planned' | 'ongoing' | 'completed' | 'cancelled',
      });
      loadActivities();
    } catch (error) {
      console.error('Failed to update activity status:', error);
      alert('Gagal mengubah status kegiatan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityFormData({
      title: activity.title,
      description: activity.description,
      type: activity.type,
      scheduled_date: new Date(activity.scheduled_date),
      end_date: activity.end_date ? new Date(activity.end_date) : null,
      location: activity.location,
      participants: activity.participants,
      photos: activity.photos,
      created_by: activity.created_by,
    });
  };

  // Close edit dialog
  const closeEditDialog = () => {
    setEditingActivity(null);
    resetActivityForm();
  };

  // Activity type and status labels
  const typeLabels = {
    'harian': '📅 Harian',
    'mingguan': '📅 Mingguan',
    'bulanan': '📅 Bulanan',
    'khusus': '⭐ Khusus'
  };

  const statusLabels = {
    'planned': '📋 Direncanakan',
    'ongoing': '⏳ Berlangsung',
    'completed': '✅ Selesai',
    'cancelled': '❌ Dibatalkan'
  };

  const statusColors = {
    'planned': 'bg-blue-100 text-blue-800',
    'ongoing': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  // Calculate statistics
  const totalActivities = activities.length;
  const upcomingActivities = activities.filter(a => a.status === 'planned' && new Date(a.scheduled_date) > new Date()).length;
  const ongoingActivities = activities.filter(a => a.status === 'ongoing').length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      {backendStatus === 'error' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>🚧 Mode Demo:</strong> Menampilkan data contoh kegiatan panti asuhan. 
            Perubahan data akan tersedia setelah backend terintegrasi.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span>🎯 Manajemen Kegiatan</span>
              </CardTitle>
              <CardDescription>
                Kelola jadwal dan kegiatan panti asuhan
              </CardDescription>
            </div>
            <Dialog open={isAddActivityDialogOpen} onOpenChange={setIsAddActivityDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kegiatan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>➕ Tambah Kegiatan Baru</DialogTitle>
                  <DialogDescription>
                    Buat jadwal kegiatan baru untuk panti asuhan
                    {backendStatus === 'error' && (
                      <span className="block mt-2 text-amber-600">
                        ⚠️ Mode demo: Data tidak akan tersimpan permanen
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateActivity} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Judul Kegiatan *</Label>
                      <Input
                        id="title"
                        value={activityFormData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setActivityFormData((prev: CreateActivityInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Jenis Kegiatan *</Label>
                      <Select
                        value={activityFormData.type || 'harian'}
                        onValueChange={(value: ActivityType) =>
                          setActivityFormData((prev: CreateActivityInput) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="harian">📅 Harian</SelectItem>
                          <SelectItem value="mingguan">📅 Mingguan</SelectItem>
                          <SelectItem value="bulanan">📅 Bulanan</SelectItem>
                          <SelectItem value="khusus">⭐ Khusus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={activityFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setActivityFormData((prev: CreateActivityInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Detail kegiatan yang akan dilakukan..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tanggal Mulai *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(activityFormData.scheduled_date, "dd MMMM yyyy", { locale: localeId })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={activityFormData.scheduled_date}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                setActivityFormData((prev: CreateActivityInput) => ({ ...prev, scheduled_date: date }))
                              }
                            }}
                            disabled={(date: Date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Tanggal Selesai</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {activityFormData.end_date 
                              ? format(activityFormData.end_date, "dd MMMM yyyy", { locale: localeId })
                              : "Pilih tanggal"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={activityFormData.end_date || undefined}
                            onSelect={(date: Date | undefined) => {
                              setActivityFormData((prev: CreateActivityInput) => ({ ...prev, end_date: date || null }))
                            }}
                            disabled={(date: Date) => date < activityFormData.scheduled_date}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Lokasi</Label>
                    <Input
                      id="location"
                      value={activityFormData.location || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setActivityFormData((prev: CreateActivityInput) => ({
                          ...prev,
                          location: e.target.value || null
                        }))
                      }
                      placeholder="Lokasi kegiatan..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="participants">Peserta</Label>
                    <Textarea
                      id="participants"
                      value={activityFormData.participants || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setActivityFormData((prev: CreateActivityInput) => ({
                          ...prev,
                          participants: e.target.value || null
                        }))
                      }
                      placeholder="Daftar peserta kegiatan..."
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddActivityDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{totalActivities}</div>
              <div className="text-sm text-blue-600">Total Kegiatan</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{upcomingActivities}</div>
              <div className="text-sm text-yellow-600">📋 Akan Datang</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{ongoingActivities}</div>
              <div className="text-sm text-orange-600">⏳ Berlangsung</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{completedActivities}</div>
              <div className="text-sm text-green-600">✅ Selesai</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="🔍 Cari kegiatan..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="harian">📅 Harian</SelectItem>
                  <SelectItem value="mingguan">📅 Mingguan</SelectItem>
                  <SelectItem value="bulanan">📅 Bulanan</SelectItem>
                  <SelectItem value="khusus">⭐ Khusus</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="planned">📋 Direncanakan</SelectItem>
                  <SelectItem value="ongoing">⏳ Berlangsung</SelectItem>
                  <SelectItem value="completed">✅ Selesai</SelectItem>
                  <SelectItem value="cancelled">❌ Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Tidak ada kegiatan yang sesuai dengan filter.'
                : (backendStatus === 'error' 
                    ? 'Mode demo: Silakan refresh halaman untuk melihat data contoh.'
                    : 'Belum ada kegiatan bulan ini.'
                  )
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredActivities.map((activity: Activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">
                        {typeLabels[activity.type]}
                      </Badge>
                      <Badge className={statusColors[activity.status]}>
                        {statusLabels[activity.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(activity)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activity.description && (
                  <p className="text-sm text-gray-600">{activity.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span>
                      {format(new Date(activity.scheduled_date), "dd MMMM yyyy", { locale: localeId })}
                      {activity.end_date && activity.end_date !== activity.scheduled_date && (
                        <span> - {format(new Date(activity.end_date), "dd MMMM yyyy", { locale: localeId })}</span>
                      )}
                    </span>
                  </div>

                  {activity.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{activity.location}</span>
                    </div>
                  )}

                  {activity.participants && (
                    <div className="flex items-start space-x-2">
                      <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-xs">{activity.participants}</span>
                    </div>
                  )}

                  {activity.photos && (
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-gray-400" />
                      <a 
                        href={activity.photos} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Lihat Foto Kegiatan
                      </a>
                    </div>
                  )}
                </div>

                {/* Status Change Buttons */}
                <div className="flex space-x-2 pt-2">
                  {activity.status === 'planned' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(activity, 'ongoing')}
                      disabled={isLoading}
                    >
                      ▶️ Mulai
                    </Button>
                  )}
                  
                  {activity.status === 'ongoing' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(activity, 'completed')}
                      disabled={isLoading}
                    >
                      ✅ Selesai
                    </Button>
                  )}
                  
                  {(activity.status === 'planned' || activity.status === 'ongoing') && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(activity, 'cancelled')}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      ❌ Batal
                    </Button>
                  )}
                </div>

                <div className="pt-2 text-xs text-gray-400 border-t">
                  Dibuat: {format(new Date(activity.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingActivity !== null} onOpenChange={() => closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ Edit Kegiatan</DialogTitle>
            <DialogDescription>
              Perbarui informasi kegiatan {editingActivity?.title}
              {backendStatus === 'error' && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ Mode demo: Perubahan tidak akan tersimpan permanen
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditActivity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_title">Judul Kegiatan *</Label>
                <Input
                  id="edit_title"
                  value={activityFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setActivityFormData((prev: CreateActivityInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <Label>Jenis Kegiatan *</Label>
                <Select
                  value={activityFormData.type || 'harian'}
                  onValueChange={(value: ActivityType) =>
                    setActivityFormData((prev: CreateActivityInput) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harian">📅 Harian</SelectItem>
                    <SelectItem value="mingguan">📅 Mingguan</SelectItem>
                    <SelectItem value="bulanan">📅 Bulanan</SelectItem>
                    <SelectItem value="khusus">⭐ Khusus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_description">Deskripsi</Label>
              <Textarea
                id="edit_description"
                value={activityFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setActivityFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                placeholder="Detail kegiatan yang akan dilakukan..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Mulai *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(activityFormData.scheduled_date, "dd MMMM yyyy", { locale: localeId })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={activityFormData.scheduled_date}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setActivityFormData((prev: CreateActivityInput) => ({ ...prev, scheduled_date: date }))
                        }
                      }}
                      disabled={(date: Date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Tanggal Selesai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activityFormData.end_date 
                        ? format(activityFormData.end_date, "dd MMMM yyyy", { locale: localeId })
                        : "Pilih tanggal"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={activityFormData.end_date || undefined}
                      onSelect={(date: Date | undefined) => {
                        setActivityFormData((prev: CreateActivityInput) => ({ ...prev, end_date: date || null }))
                      }}
                      disabled={(date: Date) => date < activityFormData.scheduled_date}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_location">Lok asi</Label>
              <Input
                id="edit_location"
                value={activityFormData.location || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setActivityFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    location: e.target.value || null
                  }))
                }
                placeholder="Lokasi kegiatan..."
              />
            </div>

            <div>
              <Label htmlFor="edit_participants">Peserta</Label>
              <Textarea
                id="edit_participants"
                value={activityFormData.participants || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setActivityFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    participants: e.target.value || null
                  }))
                }
                placeholder="Daftar peserta kegiatan..."
              />
            </div>

            <div>
              <Label htmlFor="edit_photos">URL Foto</Label>
              <Input
                id="edit_photos"
                type="url"
                value={activityFormData.photos || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setActivityFormData((prev: CreateActivityInput) => ({
                    ...prev,
                    photos: e.target.value || null
                  }))
                }
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
