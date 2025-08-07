
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon,
  Users,
  Search,
  Filter,
  Download,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { Child, CreateChildInput, UpdateChildInput, Gender, EducationStatus } from '../../../server/src/schema';

interface ChildrenManagementProps {
  children: Child[];
  onChildrenUpdate: () => void;
  backendStatus: 'loading' | 'connected' | 'error';
}

export function ChildrenManagement({ children, onChildrenUpdate, backendStatus }: ChildrenManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [educationFilter, setEducationFilter] = useState<string>('all');

  // Form state for creating/editing children
  const [formData, setFormData] = useState<CreateChildInput>({
    full_name: '',
    birth_date: new Date(),
    gender: 'laki-laki' as Gender,
    education_status: 'belum_sekolah',
    health_history: null,
    guardian_info: null,
    notes: null,
  });

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData({
      full_name: '',
      birth_date: new Date(),
      gender: 'laki-laki' as Gender,
      education_status: 'belum_sekolah',
      health_history: null,
      guardian_info: null,
      notes: null,
    });
  }, []);

  // Filter children based on search and filters
  const filteredChildren = children.filter((child: Child) => {
    const matchesSearch = child.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || child.gender === genderFilter;
    const matchesEducation = educationFilter === 'all' || child.education_status === educationFilter;
    
    return matchesSearch && matchesGender && matchesEducation;
  });

  // Handle create child
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendStatus === 'error') {
      alert('Mode demo: Data tidak dapat disimpan secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trpc.createChild.mutate(formData);
      setIsAddDialogOpen(false);
      resetForm();
      onChildrenUpdate();
    } catch (error) {
      console.error('Failed to create child:', error);
      alert('Gagal menambah data anak asuh. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit child
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    
    if (backendStatus === 'error') {
      alert('Mode demo: Data tidak dapat diubah secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }

    setIsLoading(true);
    
    try {
      const updateData: UpdateChildInput = {
        id: editingChild.id,
        ...formData,
      };
      
      await trpc.updateChild.mutate(updateData);
      setEditingChild(null);
      resetForm();
      onChildrenUpdate();
    } catch (error) {
      console.error('Failed to update child:', error);
      alert('Gagal mengubah data anak asuh. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    setFormData({
      full_name: child.full_name,
      birth_date: new Date(child.birth_date),
      gender: child.gender,
      education_status: child.education_status,
      health_history: child.health_history,
      guardian_info: child.guardian_info,
      notes: child.notes,
    });
  };

  // Close edit dialog
  const closeEditDialog = () => {
    setEditingChild(null);
    resetForm();
  };

  // Calculate age
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

  // Gender labels
  const genderLabels = {
    'laki-laki': '👦 Laki-laki',
    'perempuan': '👧 Perempuan'
  };

  // Education status labels
  const educationLabels = {
    'belum_sekolah': '🏠 Belum Sekolah',
    'tk': '🎨 TK',
    'sd': '📚 SD',
    'smp': '📖 SMP',
    'sma': '🎓 SMA',
    'kuliah': '🎓 Kuliah',
    'lulus': '✅ Lulus'
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      {backendStatus === 'error' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>🚧 Mode Demo:</strong> Menampilkan data contoh anak asuh. 
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
                <Users className="h-5 w-5 text-blue-600" />
                <span>👨‍👩‍👧‍👦 Manajemen Anak Asuh</span>
              </CardTitle>
              <CardDescription>
                Kelola data dan informasi anak-anak asuhan
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Tambah Anak
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>➕ Tambah Anak Asuh Baru</DialogTitle>
                    <DialogDescription>
                      Isi formulir berikut untuk menambah anak asuh baru
                      {backendStatus === 'error' && (
                        <span className="block mt-2 text-amber-600">
                          ⚠️ Mode demo: Data tidak akan tersimpan permanen
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Nama Lengkap *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateChildInput) => ({ ...prev, full_name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>Tanggal Lahir *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(formData.birth_date, "dd MMMM yyyy", { locale: localeId })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.birth_date}
                              onSelect={(date: Date | undefined) => {
                                if (date) {
                                  setFormData((prev: CreateChildInput) => ({ ...prev, birth_date: date }))
                                }
                              }}
                              disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>Jenis Kelamin *</Label>
                        <Select
                          value={formData.gender || 'laki-laki'}
                          onValueChange={(value: Gender) =>
                            setFormData((prev: CreateChildInput) => ({ ...prev, gender: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="laki-laki">👦 Laki-laki</SelectItem>
                            <SelectItem value="perempuan">👧 Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Status Pendidikan *</Label>
                        <Select
                          value={formData.education_status || 'belum_sekolah'}
                          onValueChange={(value: EducationStatus) =>
                            setFormData((prev: CreateChildInput) => ({ ...prev, education_status: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="belum_sekolah">🏠 Belum Sekolah</SelectItem>
                            <SelectItem value="tk">🎨 TK</SelectItem>
                            <SelectItem value="sd">📚 SD</SelectItem>
                            <SelectItem value="smp">📖 SMP</SelectItem>
                            <SelectItem value="sma">🎓 SMA</SelectItem>
                            <SelectItem value="kuliah">🎓 Kuliah</SelectItem>
                            <SelectItem value="lulus">✅ Lulus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="health_history">Riwayat Kesehatan</Label>
                      <Textarea
                        id="health_history"
                        value={formData.health_history || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChildInput) => ({
                            ...prev,
                            health_history: e.target.value || null
                          }))
                        }
                        placeholder="Catatan kesehatan, alergi, atau kondisi khusus..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="guardian_info">Informasi Wali</Label>
                      <Textarea
                        id="guardian_info"
                        value={formData.guardian_info || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChildInput) => ({
                            ...prev,
                            guardian_info: e.target.value || null
                          }))
                        }
                        placeholder="Informasi tentang wali atau keluarga..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Catatan Tambahan</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChildInput) => ({
                            ...prev,
                            notes: e.target.value || null
                          }))
                        }
                        placeholder="Catatan lain tentang anak..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="🔍 Cari nama anak..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gender</SelectItem>
                  <SelectItem value="laki-laki">👦 Laki-laki</SelectItem>
                  <SelectItem value="perempuan">👧 Perempuan</SelectItem>
                </SelectContent>
              </Select>

              <Select value={educationFilter} onValueChange={setEducationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pendidikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="belum_sekolah">🏠 Belum Sekolah</SelectItem>
                  <SelectItem value="tk">🎨 TK</SelectItem>
                  <SelectItem value="sd">📚 SD</SelectItem>
                  <SelectItem value="smp">📖 SMP</SelectItem>
                  <SelectItem value="sma">🎓 SMA</SelectItem>
                  <SelectItem value="kuliah">🎓 Kuliah</SelectItem>
                  <SelectItem value="lulus">✅ Lulus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredChildren.length}</div>
              <div className="text-sm text-blue-600">Total Ditampilkan</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredChildren.filter(c => c.gender === 'laki-laki').length}
              </div>
              <div className="text-sm text-green-600">👦 Laki-laki</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-pink-600">
                {filteredChildren.filter(c => c.gender === 'perempuan').length}
              </div>
              <div className="text-sm text-pink-600">👧 Perempuan</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(filteredChildren.reduce((sum, child) => sum + calculateAge(child.birth_date), 0) / filteredChildren.length) || 0}
              </div>
              <div className="text-sm text-purple-600">Rata-rata Umur</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children List */}
      {filteredChildren.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || genderFilter !== 'all' || educationFilter !== 'all' 
                ? 'Tidak ada anak yang sesuai dengan filter.'
                : (backendStatus === 'error' 
                    ? 'Mode demo: Silakan refresh halaman untuk melihat data contoh.'
                    : 'Belum ada data anak asuh. Tambah anak asuh pertama!'
                  )
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
                  <div>
                    <CardTitle className="text-lg">{child.full_name}</CardTitle>
                    <CardDescription>
                      {calculateAge(child.birth_date)} tahun • {genderLabels[child.gender]}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(child)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Data Anak</AlertDialogTitle>
                          <AlertDialogDescription>
                            {backendStatus === 'error' 
                              ? `Mode demo: Fitur hapus data untuk ${child.full_name} akan tersedia setelah backend terintegrasi.`
                              : `Apakah Anda yakin ingin menghapus data ${child.full_name}? Tindakan ini tidak dapat dibatalkan.`
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              if (backendStatus === 'error') {
                                alert('Mode demo: Data tidak dapat dihapus secara permanen.');
                              }
                            }}
                          >
                            {backendStatus === 'error' ? 'OK' : 'Hapus'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Tanggal Lahir:</p>
                  <p className="font-medium">
                    {format(new Date(child.birth_date), "dd MMMM yyyy", { locale: localeId })}
                  </p>
                </div>

                <div>
                  <Badge variant="secondary">
                    {educationLabels[child.education_status]}
                  </Badge>
                </div>

                {child.health_history && (
                  <div>
                    <p className="text-sm text-gray-600">Riwayat Kesehatan:</p>
                    <p className="text-sm">{child.health_history}</p>
                  </div>
                )}

                {child.guardian_info && (
                  <div>
                    <p className="text-sm text-gray-600">Info Wali:</p>
                    <p className="text-sm">{child.guardian_info}</p>
                  </div>
                )}

                <div className="pt-2 text-xs text-gray-500">
                  Didaftarkan: {format(new Date(child.created_at), "dd MMM yyyy", { locale: localeId })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingChild !== null} onOpenChange={() => closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ Edit Data Anak Asuh</DialogTitle>
            <DialogDescription>
              Perbarui informasi {editingChild?.full_name}
              {backendStatus === 'error' && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ Mode demo: Perubahan tidak akan tersimpan permanen
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_full_name">Nama Lengkap *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateChildInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label>Tanggal Lahir *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.birth_date, "dd MMMM yyyy", { locale: localeId })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birth_date}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setFormData((prev: CreateChildInput) => ({ ...prev, birth_date: date }))
                        }
                      }}
                      disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Jenis Kelamin *</Label>
                <Select
                  value={formData.gender || 'laki-laki'}
                  onValueChange={(value: Gender) =>
                    setFormData((prev: CreateChildInput) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laki-laki">👦 Laki-laki</SelectItem>
                    <SelectItem value="perempuan">👧 Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status Pendidikan *</Label>
                <Select
                  value={formData.education_status || 'belum_sekolah'}
                  onValueChange={(value: EducationStatus) =>
                    setFormData((prev: CreateChildInput) => ({ ...prev, education_status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_sekolah">🏠 Belum Sekolah</SelectItem>
                    <SelectItem value="tk">🎨 TK</SelectItem>
                    <SelectItem value="sd">📚 SD</SelectItem>
                    <SelectItem value="smp">📖 SMP</SelectItem>
                    <SelectItem value="sma">🎓 SMA</SelectItem>
                    <SelectItem value="kuliah">🎓 Kuliah</SelectItem>
                    <SelectItem value="lulus">✅ Lulus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_health_history">Riwayat Kesehatan</Label>
              <Textarea
                id="edit_health_history"
                value={formData.health_history || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateChildInput) => ({
                    ...prev,
                    health_history: e.target.value || null
                  }))
                }
                placeholder="Catatan kesehatan, alergi, atau kondisi khusus..."
              />
            </div>

            <div>
              <Label htmlFor="edit_guardian_info">Informasi Wali</Label>
              <Textarea
                id="edit_guardian_info"
                value={formData.guardian_info || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateChildInput) => ({
                    ...prev,
                    guardian_info: e.target.value || null
                  }))
                }
                placeholder="Informasi tentang wali atau keluarga..."
              />
            </div>

            <div>
              <Label htmlFor="edit_notes">Catatan Tambahan</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateChildInput) => ({
                    ...prev,
                    notes: e.target.value || null
                  }))
                }
                placeholder="Catatan lain tentang anak..."
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
