
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
  UserPlus, 
  Edit, 
  Calendar as CalendarIcon, 
  Search,
  Users,
  Baby,
  GraduationCap,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { 
  Child, 
  CreateChildInput, 
  UpdateChildInput, 
  UserRole,
  Gender,
  EducationStatus
} from '../../../server/src/schema';

interface ChildrenManagementProps {
  currentUser: {
    id: number;
    full_name: string;
    role: UserRole;
    email: string;
  };
}

export function ChildrenManagement({ currentUser }: ChildrenManagementProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [educationFilter, setEducationFilter] = useState<string>('all');

  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateChildInput>({
    full_name: '',
    birth_date: new Date(),
    gender: 'laki-laki',
    education_status: 'belum_sekolah',
    health_history: null,
    guardian_info: null,
    notes: null,
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateChildInput>>({});

  const loadChildren = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getChildren.query();
      setChildren(result);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  // Filter children based on search and filters
  const filteredChildren = children.filter(child => {
    const matchesSearch = child.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && child.is_active) ||
      (statusFilter === 'inactive' && !child.is_active);
    const matchesEducation = educationFilter === 'all' || child.education_status === educationFilter;
    
    return matchesSearch && matchesStatus && matchesEducation;
  });

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newChild = await trpc.createChild.mutate(createFormData);
      setChildren((prev: Child[]) => [...prev, newChild]);
      setIsCreateDialogOpen(false);
      setCreateFormData({
        full_name: '',
        birth_date: new Date(),
        gender: 'laki-laki',
        education_status: 'belum_sekolah',
        health_history: null,
        guardian_info: null,
        notes: null,
      });
    } catch (error) {
      console.error('Failed to create child:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    
    setIsSubmitting(true);
    
    try {
      const updateData = {
        id: editingChild.id,
        ...editFormData,
      };
      
      const updatedChild = await trpc.updateChild.mutate(updateData);
      setChildren((prev: Child[]) => 
        prev.map(child => child.id === editingChild.id ? updatedChild : child)
      );
      setIsEditDialogOpen(false);
      setEditingChild(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update child:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (child: Child) => {
    setEditingChild(child);
    setEditFormData({
      full_name: child.full_name,
      birth_date: child.birth_date,
      gender: child.gender,
      education_status: child.education_status,
      health_history: child.health_history,
      guardian_info: child.guardian_info,
      notes: child.notes,
      is_active: child.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getEducationStatusLabel = (status: EducationStatus) => {
    const labels: Record<EducationStatus, string> = {
      
      belum_sekolah: 'Belum Sekolah',
      tk: 'TK',
      sd: 'SD',
      smp: 'SMP', 
      sma: 'SMA',
      kuliah: 'Kuliah',
      lulus: 'Lulus'
    };
    return labels[status];
  };

  const getGenderLabel = (gender: Gender) => {
    return gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        ✅ Aktif
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
        ❌ Tidak Aktif
      </Badge>
    );
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'pengurus';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">👶 Manajemen Anak Asuh</h2>
          <p className="text-gray-600 mt-1">
            Kelola data dan informasi anak-anak asuh di panti
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Anak Asuh
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Anak Asuh Baru</DialogTitle>
                <DialogDescription>
                  Isi informasi lengkap anak asuh yang akan ditambahkan
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateChild}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      value={createFormData.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateChildInput) => ({ ...prev, full_name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Lahir *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(createFormData.birth_date, 'dd MMMM yyyy', { locale: id })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={createFormData.birth_date}
                          onSelect={(date: Date | undefined) =>
                            date && setCreateFormData((prev: CreateChildInput) => ({ ...prev, birth_date: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin *</Label>
                    <Select
                      value={createFormData.gender || 'laki-laki'}
                      onValueChange={(value: Gender) =>
                        setCreateFormData((prev: CreateChildInput) => ({ ...prev, gender: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status Pendidikan *</Label>
                    <Select
                      value={createFormData.education_status || 'belum_sekolah'}
                      onValueChange={(value: EducationStatus) =>
                        setCreateFormData((prev: CreateChildInput) => ({ ...prev, education_status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="belum_sekolah">Belum Sekolah</SelectItem>
                        <SelectItem value="tk">TK</SelectItem>
                        <SelectItem value="sd">SD</SelectItem>
                        <SelectItem value="smp">SMP</SelectItem>
                        <SelectItem value="sma">SMA</SelectItem>
                        <SelectItem value="kuliah">Kuliah</SelectItem>
                        <SelectItem value="lulus">Lulus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="health_history">Riwayat Kesehatan</Label>
                    <Textarea
                      id="health_history"
                      value={createFormData.health_history || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateChildInput) => ({ 
                          ...prev, 
                          health_history: e.target.value || null 
                        }))
                      }
                      placeholder="Catatan kesehatan, alergi, riwayat penyakit..."
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="guardian_info">Informasi Wali</Label>
                    <Textarea
                      id="guardian_info"
                      value={createFormData.guardian_info || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateChildInput) => ({ 
                          ...prev, 
                          guardian_info: e.target.value || null 
                        }))
                      }
                      placeholder="Informasi keluarga, kontak darurat..."
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Catatan Tambahan</Label>
                    <Textarea
                      id="notes"
                      value={createFormData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateChildInput) => ({ 
                          ...prev, 
                          notes: e.target.value || null 
                        }))
                      }
                      placeholder="Catatan lainnya..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari nama anak..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>

            <Select value={educationFilter} onValueChange={setEducationFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pendidikan</SelectItem>
                <SelectItem value="belum_sekolah">Belum Sekolah</SelectItem>
                <SelectItem value="tk">TK</SelectItem>
                <SelectItem value="sd">SD</SelectItem>
                <SelectItem value="smp">SMP</SelectItem>
                <SelectItem value="sma">SMA</SelectItem>
                <SelectItem value="kuliah">Kuliah</SelectItem>
                <SelectItem value="lulus">Lulus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Anak</p>
                <p className="text-2xl font-bold text-blue-900">{children.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Anak Aktif</p>
                <p className="text-2xl font-bold text-green-900">
                  {children.filter(c => c.is_active).length}
                </p>
              </div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Laki-laki</p>
                <p className="text-2xl font-bold text-purple-900">
                  {children.filter(c => c.gender === 'laki-laki').length}
                </p>
              </div>
              <Baby className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-600 text-sm font-medium">Perempuan</p>
                <p className="text-2xl font-bold text-pink-900">
                  {children.filter(c => c.gender === 'perempuan').length}
                </p>
              </div>
              <Baby className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children List */}
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
      ) : filteredChildren.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || educationFilter !== 'all' 
                ? 'Tidak ada anak yang sesuai filter'
                : 'Belum ada data anak asuh'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || educationFilter !== 'all' 
                ? 'Coba ubah kriteria pencarian atau filter'
                : canEdit 
                  ? 'Mulai dengan menambahkan data anak asuh pertama'
                  : 'Data anak asuh akan muncul di sini'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child: Child) => (
            <Card key={child.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{child.full_name}</CardTitle>
                  {getStatusBadge(child.is_active)}
                </div>
                <CardDescription>
                  {getGenderLabel(child.gender)} • {calculateAge(child.birth_date)} tahun
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {getEducationStatusLabel(child.education_status)}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(child.birth_date, 'dd MMMM yyyy', { locale: id })}
                </div>

                {child.health_history && (
                  <div className="text-sm">
                    <strong className="text-red-600">Kesehatan:</strong>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {child.health_history}
                    </p>
                  </div>
                )}

                {child.guardian_info && (
                  <div className="text-sm">
                    <strong className="text-blue-600">Wali:</strong>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {child.guardian_info}
                    </p>
                  </div>
                )}

                {child.notes && (
                  <div className="text-sm">
                    <strong className="text-gray-700">Catatan:</strong>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {child.notes}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Terdaftar: {format(child.created_at, 'dd/MM/yyyy')}
                  </span>
                  
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(child)}
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
      {editingChild && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Data Anak Asuh</DialogTitle>
              <DialogDescription>
                Perbarui informasi untuk {editingChild.full_name}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditChild}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Nama Lengkap *</Label>
                  <Input
                    id="edit_full_name"
                    value={editFormData.full_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        full_name: e.target.value 
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Lahir *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editFormData.birth_date && format(editFormData.birth_date, 'dd MMMM yyyy', { locale: id })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFormData.birth_date}
                        onSelect={(date: Date | undefined) =>
                          date && setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                            ...prev, 
                            birth_date: date 
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kelamin *</Label>
                  <Select
                    value={editFormData.gender || 'laki-laki'}
                    onValueChange={(value: Gender) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        gender: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Pendidikan *</Label>
                  <Select
                    value={editFormData.education_status || 'belum_sekolah'}
                    onValueChange={(value: EducationStatus) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        education_status: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="belum_sekolah">Belum Sekolah</SelectItem>
                      <SelectItem value="tk">TK</SelectItem>
                      <SelectItem value="sd">SD</SelectItem>
                      <SelectItem value="smp">SMP</SelectItem>
                      <SelectItem value="sma">SMA</SelectItem>
                      <SelectItem value="kuliah">Kuliah</SelectItem>
                      <SelectItem value="lulus">Lulus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Status Anak</Label>
                  <Select
                    value={editFormData.is_active !== undefined ? (editFormData.is_active ? 'true' : 'false') : 'true'}
                    onValueChange={(value: string) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        is_active: value === 'true' 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_health_history">Riwayat Kesehatan</Label>
                  <Textarea
                    id="edit_health_history"
                    value={editFormData.health_history || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        health_history: e.target.value || null 
                      }))
                    }
                    placeholder="Catatan kesehatan, alergi, riwayat penyakit..."
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_guardian_info">Informasi Wali</Label>
                  <Textarea
                    id="edit_guardian_info"
                    value={editFormData.guardian_info || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        guardian_info: e.target.value || null 
                      }))
                    }
                    placeholder="Informasi keluarga, kontak darurat..."
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_notes">Catatan Tambahan</Label>
                  <Textarea
                    id="edit_notes"
                    value={editFormData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateChildInput>) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    placeholder="Catatan lainnya..."
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
