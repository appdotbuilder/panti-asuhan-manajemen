
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, 
  Plus,
  Calendar as CalendarIcon, 
  Search,
  DollarSign,
  Package,
  Heart,
  User,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { 
  Donor,
  Donation, 
  CreateDonorInput,
  CreateDonationInput, 
  UserRole,
  DonationType
} from '../../../server/src/schema';

interface DonationManagementProps {
  currentUser: {
    id: number;
    full_name: string;
    role: UserRole;
    email: string;
  };
}

export function DonationManagement({ currentUser }: DonationManagementProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DonationType>('all');
  
  // Date range for filtering donations
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Dialog states
  const [isDonorDialogOpen, setIsDonorDialogOpen] = useState(false);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [donorFormData, setDonorFormData] = useState<CreateDonorInput>({
    full_name: '',
    email: null,
    phone: null,
    address: null,
    user_id: null,
  });

  const [donationFormData, setDonationFormData] = useState<CreateDonationInput>({
    donor_id: 0,
    type: 'uang',
    amount: null,
    item_description: null,
    item_quantity: null,
    donation_date: new Date(),
    notes: null,
  });

  const loadDonors = useCallback(async () => {
    try {
      const result = await trpc.getDonors.query();
      setDonors(result);
    } catch (error) {
      console.error('Failed to load donors:', error);
    }
  }, []);

  const loadDonations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getDonationsByDateRange.query({
        start_date: startDate,
        end_date: endDate,
      });
      setDonations(result);
    } catch (error) {
      console.error('Failed to load donations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadDonors();
    loadDonations();
  }, [loadDonors, loadDonations]);

  // Filter donations
  const filteredDonations = donations.filter(donation => {
    const donor = donors.find(d => d.id === donation.donor_id);
    const matchesSearch = donor?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesType = typeFilter === 'all' || donation.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newDonor = await trpc.createDonor.mutate(donorFormData);
      setDonors((prev: Donor[]) => [...prev, newDonor]);
      setIsDonorDialogOpen(false);
      setDonorFormData({
        full_name: '',
        email: null,
        phone: null,
        address: null,
        user_id: null,
      });
    } catch (error) {
      console.error('Failed to create donor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newDonation = await trpc.createDonation.mutate(donationFormData);
      setDonations((prev: Donation[]) => [...prev, newDonation]);
      setIsDonationDialogOpen(false);
      setDonationFormData({
        donor_id: 0,
        type: 'uang',
        amount: null,
        item_description: null,
        item_quantity: null,
        donation_date: new Date(),
        notes: null,
      });
    } catch (error) {
      console.error('Failed to create donation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDonorName = (donorId: number) => {
    const donor = donors.find(d => d.id === donorId);
    return donor?.full_name || 'Unknown Donor';
  };

  const calculateStats = () => {
    const totalAmount = filteredDonations
      .filter(d => d.type === 'uang' && d.amount)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const totalItems = filteredDonations
      .filter(d => d.type === 'barang' && d.item_quantity)
      .reduce((sum, d) => sum + (d.item_quantity || 0), 0);
    
    const uniqueDonors = new Set(filteredDonations.map(d => d.donor_id)).size;
    
    return { totalAmount, totalItems, uniqueDonors };
  };

  const stats = calculateStats();
  const canManage = currentUser.role === 'admin' || currentUser.role === 'pengurus';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">💝 Manajemen Donasi</h2>
          <p className="text-gray-600 mt-1">
            Kelola donatur dan catatan donasi masuk
          </p>
        </div>
        
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={isDonorDialogOpen} onOpenChange={setIsDonorDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Tambah Donatur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Donatur Baru</DialogTitle>
                  <DialogDescription>
                    Daftarkan donatur baru ke dalam sistem
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateDonor}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor_name">Nama Lengkap *</Label>
                      <Input
                        id="donor_name"
                        value={donorFormData.full_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDonorFormData((prev: CreateDonorInput) => ({ 
                            ...prev, 
                            full_name: e.target.value 
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="donor_email">Email</Label>
                      <Input
                        id="donor_email"
                        type="email"
                        value={donorFormData.email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDonorFormData((prev: CreateDonorInput) => ({ 
                            ...prev, 
                            email: e.target.value || null 
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="donor_phone">Nomor Telepon</Label>
                      <Input
                        id="donor_phone"
                        value={donorFormData.phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDonorFormData((prev: CreateDonorInput) => ({ 
                            ...prev, 
                            phone: e.target.value || null 
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="donor_address">Alamat</Label>
                      <Textarea
                        id="donor_address"
                        value={donorFormData.address || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDonorFormData((prev: CreateDonorInput) => ({ 
                            ...prev, 
                            address: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Donatur'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDonationDialogOpen} onOpenChange={setIsDonationDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Catat Donasi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Catat Donasi Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan catatan donasi yang baru diterima
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateDonation}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Donatur *</Label>
                      <Select
                        value={donationFormData.donor_id > 0 ? donationFormData.donor_id.toString() : ''}
                        onValueChange={(value: string) =>
                          setDonationFormData((prev: CreateDonationInput) => ({ 
                            ...prev, 
                            donor_id: parseInt(value) || 0
                          }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih donatur" />
                        </SelectTrigger>
                        <SelectContent>
                          {donors.map(donor => (
                            <SelectItem key={donor.id} value={donor.id.toString()}>
                              {donor.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Jenis Donasi *</Label>
                      <Select
                        value={donationFormData.type}
                        onValueChange={(value: DonationType) =>
                          setDonationFormData((prev: CreateDonationInput) => ({ 
                            ...prev, 
                            type: value,
                            // Reset fields when type changes
                            amount: value === 'uang' ? prev.amount : null,
                            item_description: value === 'barang' ? prev.item_description : null,
                            item_quantity: value === 'barang' ? prev.item_quantity : null,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uang">💰 Uang</SelectItem>
                          <SelectItem value="barang">📦 Barang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {donationFormData.type === 'uang' && (
                      <div className="space-y-2">
                        <Label htmlFor="amount">Jumlah (Rupiah) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="1"
                          value={donationFormData.amount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDonationFormData((prev: CreateDonationInput) => ({ 
                              ...prev, 
                              amount: parseFloat(e.target.value) || null 
                            }))
                          }
                          required
                        />
                      </div>
                    )}

                    {donationFormData.type === 'barang' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="item_description">Deskripsi Barang *</Label>
                          <Input
                            id="item_description"
                            value={donationFormData.item_description || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setDonationFormData((prev: CreateDonationInput) => ({ 
                                ...prev, 
                                item_description: e.target.value || null 
                              }))
                            }
                            placeholder="Contoh: Beras, Pakaian anak, Buku tulis"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="item_quantity">Jumlah/Kuantitas *</Label>
                          <Input
                            id="item_quantity"
                            type="number"
                            min="1"
                            value={donationFormData.item_quantity || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setDonationFormData((prev: CreateDonationInput) => ({ 
                                ...prev, 
                                item_quantity: parseInt(e.target.value) || null 
                              }))
                            }
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Tanggal Donasi *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(donationFormData.donation_date, 'dd MMMM yyyy', { locale: id })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={donationFormData.donation_date}
                            onSelect={(date: Date | undefined) =>
                              date && setDonationFormData((prev: CreateDonationInput) => ({ 
                                ...prev, 
                                donation_date: date 
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="donation_notes">Catatan</Label>
                      <Textarea
                        id="donation_notes"
                        value={donationFormData.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDonationFormData((prev: CreateDonationInput) => ({ 
                            ...prev, 
                            notes: e.target.value || null 
                          }))
                        }
                        placeholder="Catatan tambahan tentang donasi"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Donasi'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Donasi Uang</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Item Barang</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Donatur Aktif</p>
                <p className="text-2xl font-bold text-purple-900">{stats.uniqueDonors}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Donasi</p>
                <p className="text-2xl font-bold text-orange-900">{filteredDonations.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
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
                  placeholder="Cari nama donatur..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={(value: 'all' | DonationType) => setTypeFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="uang">Donasi Uang</SelectItem>
                <SelectItem value="barang">Donasi Barang</SelectItem>
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

      <Tabs defaultValue="donations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donations">📝 Riwayat Donasi</TabsTrigger>
          <TabsTrigger value="donors">👥 Data Donatur</TabsTrigger>
        </TabsList>

        <TabsContent value="donations">
          {/* Donations List */}
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
          ) : filteredDonations.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Tidak ada donasi yang sesuai filter'
                    : 'Belum ada catatan donasi'
                  }
                </h3>
                <p className="text-gray-500">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Coba ubah kriteria pencarian atau filter'
                    : canManage 
                      ? 'Mulai dengan mencatat donasi pertama'
                      : 'Catatan donasi akan muncul di sini'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDonations.map((donation: Donation) => (
                <Card key={donation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {getDonorName(donation.donor_id)}
                      </CardTitle>
                      <Badge 
                        variant={donation.type === 'uang' ? 'default' : 'secondary'}
                        className={donation.type === 'uang' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                      >
                        {donation.type === 'uang' ? '💰 Uang' : '📦 Barang'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {format(donation.donation_date, 'dd MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {donation.type === 'uang' && donation.amount && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(donation.amount)}
                      </div>
                    )}

                    {donation.type === 'barang' && (
                      <div className="space-y-1">
                        <div className="font-medium text-blue-700">
                          {donation.item_description}
                        </div>
                        <div className="text-sm text-gray-600">
                          Jumlah: {donation.item_quantity} unit
                        </div>
                      </div>
                    )}

                    {donation.notes && (
                      <div className="text-sm">
                        <strong className="text-gray-700">Catatan:</strong>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {donation.notes}
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        Dicatat: {format(donation.created_at, 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="donors">
          {/* Donors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor: Donor) => {
              const donorDonations = donations.filter(d => d.donor_id === donor.id);
              const totalAmount = donorDonations
                .filter(d => d.type === 'uang' && d.amount)
                .reduce((sum, d) => sum + (d.amount || 0), 0);
              const totalItems = donorDonations
                .filter(d => d.type === 'barang')
                .length;

              return (
                <Card key={donor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-500" />
                      {donor.full_name}
                    </CardTitle>
                    <CardDescription>
                      Terdaftar: {format(donor.created_at, 'dd MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {donor.email && (
                      <div className="text-sm text-gray-600">
                        📧 {donor.email}
                      </div>
                    )}
                    
                    {donor.phone && (
                      <div className="text-sm text-gray-600">
                        📱 {donor.phone}
                      </div>
                    )}

                    {donor.address && (
                      <div className="text-sm text-gray-600">
                        📍 {donor.address}
                      </div>
                    )}

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Donasi Uang:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Donasi Barang:</span>
                        <span className="font-medium text-blue-600">
                          {totalItems} kali
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Donasi:</span>
                        <span className="font-medium">
                          {donorDonations.length} kali
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
