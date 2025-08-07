
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Search,
  Shield,
  User,
  Users,
  Crown,
  Key
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  CreateUserInput, 
  UserRole
} from '../../../server/src/schema';

interface UserManagementProps {
  currentUser: {
    id: number;
    full_name: string;
    role: UserRole;
    email: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: 'admin',
      email: 'admin@panti.com',
      full_name: 'Admin Panti Asuhan',
      phone: '+62812345678',
      role: 'admin',
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: null,
    },
    {
      id: 2,
      username: 'pengurus1',
      email: 'pengurus1@panti.com',
      full_name: 'Ibu Siti Nurhaliza',
      phone: '+62812345679',
      role: 'pengurus',
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: null,
    },
    {
      id: 3,
      username: 'donatur1',
      email: 'donatur1@email.com',
      full_name: 'Bapak Ahmad Wijaya',
      phone: '+62812345680',
      role: 'donatur',
      is_active: true,
      created_at: new Date('2024-02-01'),
      updated_at: null,
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [createFormData, setCreateFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: null,
    role: 'donatur',
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newUser = await trpc.createUser.mutate(createFormData);
      
      const userWithTimestamps: User = {
        ...newUser,
        created_at: new Date(),
        updated_at: null,
      };
      setUsers((prev: User[]) => [...prev, userWithTimestamps]);
      
      setIsCreateDialogOpen(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: null,
        role: 'donatur',
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    const icons: Record<UserRole, React.ReactNode> = {
      admin: <Crown className="h-4 w-4 text-yellow-600" />,
      pengurus: <Shield className="h-4 w-4 text-blue-600" />,
      donatur: <User className="h-4 w-4 text-green-600" />
    };
    return icons[role];
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrator',
      pengurus: 'Pengurus',
      donatur: 'Donatur'
    };
    return labels[role];
  };

  const getRoleBadge = (role: UserRole) => {
    const configs: Record<UserRole, { className: string; label: string }> = {
      admin: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: '👑 Admin' },
      pengurus: { className: 'bg-blue-100 text-blue-800 border-blue-200', label: '🛡️ Pengurus' },
      donatur: { className: 'bg-green-100 text-green-800 border-green-200', label: '💝 Donatur' }
    };
    
    const config = configs[role];
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const calculateStats = () => {
    const roleCounts = {
      admin: users.filter(u => u.role === 'admin').length,
      pengurus: users.filter(u => u.role === 'pengurus').length,
      donatur: users.filter(u => u.role === 'donatur').length,
    };
    
    const activeUsers = users.filter(u => u.is_active).length;
    
    return { roleCounts, activeUsers };
  };

  const stats = calculateStats();

  // Only admin can access user management
  if (currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Anda tidak memiliki akses untuk mengelola pengguna. 
            Fitur ini hanya tersedia untuk Administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">👥 Manajemen Pengguna</h2>
          <p className="text-gray-600 mt-1">
            Kelola akun pengguna dan hak akses sistem
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Buat akun pengguna baru dengan peran yang sesuai
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={createFormData.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateUserInput) => ({ 
                          ...prev, 
                          username: e.target.value 
                        }))
                      }
                      placeholder="username"
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      value={createFormData.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateUserInput) => ({ 
                          ...prev, 
                          full_name: e.target.value 
                        }))
                      }
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateUserInput) => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))
                    }
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateUserInput) => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))
                    }
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={createFormData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateUserInput) => ({ 
                        ...prev, 
                        phone: e.target.value || null 
                      }))
                    }
                    placeholder="+628123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Peran Pengguna *</Label>
                  <Select
                    value={createFormData.role || 'donatur'}
                    onValueChange={(value: UserRole) =>
                      setCreateFormData((prev: CreateUserInput) => ({ 
                        ...prev, 
                        role: value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">👑 Administrator</SelectItem>
                      <SelectItem value="pengurus">🛡️ Pengurus</SelectItem>
                      <SelectItem value="donatur">💝 Donatur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Membuat Akun...' : 'Buat Pengguna'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Administrator</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.roleCounts.admin}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Pengurus</p>
                <p className="text-2xl font-bold text-blue-900">{stats.roleCounts.pengurus}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Donatur</p>
                <p className="text-2xl font-bold text-green-900">{stats.roleCounts.donatur}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-gray-500" />
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
                  placeholder="Cari nama, username, atau email..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={(value: 'all' | UserRole) => setRoleFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="pengurus">Pengurus</SelectItem>
                <SelectItem value="donatur">Donatur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notice */}
      <Alert className="border-orange-200 bg-orange-50">
        <Key className="h-4 w-4" />
        <AlertDescription className="text-orange-800">
          <strong>Catatan:</strong> Data pengguna saat ini menggunakan contoh data. 
          Dalam implementasi nyata, data akan diambil dari database melalui API.
        </AlertDescription>
      </Alert>

      {/* Users List */}
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
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== 'all' 
                ? 'Tidak ada pengguna yang sesuai filter'
                : 'Belum ada pengguna terdaftar'
              }
            </h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' 
                ? 'Coba ubah kriteria pencarian atau filter'
                : 'Mulai dengan membuat akun pengguna pertama'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: User) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center text-lg">
                    {getRoleIcon(user.role)}
                    <span className="ml-2">{user.full_name}</span>
                  </CardTitle>
                  {getRoleBadge(user.role)}
                </div>
                <CardDescription>
                  @{user.username}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  📧 {user.email}
                </div>

                {user.phone && (
                  <div className="text-sm text-gray-600">
                    📱 {user.phone}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Badge 
                    variant={user.is_active ? 'default' : 'secondary'}
                    className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                  >
                    {user.is_active ? '✅ Aktif' : '❌ Tidak Aktif'}
                  </Badge>
                  
                  <span className="text-xs text-gray-500">
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Bergabung: {user.created_at.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
