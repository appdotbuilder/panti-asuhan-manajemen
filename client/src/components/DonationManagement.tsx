
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Plus, 
  Calendar as CalendarIcon,
  Search,
  Filter,
  Users,
  Gift,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { Donor, Donation, CreateDonorInput, CreateDonationInput, DonationType } from '../../../server/src/schema';

interface DonationManagementProps {
  donors: Donor[];
  onDonationsUpdate: () => void;
  backendStatus: 'loading' | 'connected' | 'error';
}

export function DonationManagement({ donors, onDonationsUpdate, backendStatus }: DonationManagementProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isAddDonorDialogOpen, setIsAddDonorDialogOpen] = useState(false);
  const [isAddDonationDialogOpen, setIsAddDonationDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  // Load donations for current month
  const loadDonations = useCallback(async () => {
    if (backendStatus === 'error') {
      // Use demo donations data
      const demoDonations: Donation[] = [
        {
          id: 1,
          donor_id: 1,
          type: 'uang',
          amount: 5000000,
          item_description: null,
          item_quantity: null,
          donation_date: new Date('2024-01-15'),
          notes: 'Donasi rutin bulanan',
          created_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          donor_id: 2,
          type: 'barang',
          amount: 2000000,
          item_description: 'Paket sembako dan pakaian',
          item_quantity: 10,
          donation_date: new Date('2024-01-20'),
          notes: 'Paket sembako untuk 10 keluarga',
          created_at: new Date('2024-01-20'),
        },
        {
          id: 3,
          donor_id: 3,
          type: 'uang',
          amount: 8750000,
          item_description: null,
          item_quantity: null,
          donation_date: new Date('2024-01-25'),
          notes: 'Donasi CSR perusahaan',
          created_at: new Date('2024-01-25'),
        },
      ];
      setDonations(demoDonations);
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

      const donationsData = await trpc.getDonationsByDateRange.query({
        start_date: startOfMonth,
        end_date: endOfMonth,
      });

      setDonations(donationsData);
    } catch (error) {
      console.error('Failed to load donations:', error);
    }
  }, [backendStatus]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // Reset forms
  const resetDonorForm = useCallback(() => {
    setDonorFormData({
      full_name: '',
      email: null,
      phone: null,
      address: null,
      user_id: null,
    });
  }, []);

  const resetDonationForm = useCallback(() => {
    setDonationFormData({
      donor_id: 0,
      type: 'uang',
      amount: null,
      item_description: null,
      item_quantity: null,
      donation_date: new Date(),
      notes: null,
    });
  }, []);

  // Filter donors and donations
  const filteredDonors = donors.filter((donor: Donor) =>
    donor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (donor.email && donor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDonations = donations.filter((donation: Donation) => {
    const donor = donors.find(d => d.id === donation.donor_id);
    const matchesSearch = !searchTerm || (donor && donor.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || donation.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Handle create donor
  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendStatus === 'error') {
      alert('Mode demo: Data donatur tidak dapat disimpan secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trpc.createDonor.mutate(donorFormData);
      setIsAddDonorDialogOpen(false);
      resetDonorForm();
      onDonationsUpdate(); // Refresh donors list
    } catch (error) {
      console.error('Failed to create donor:', error);
      alert('Gagal menambah donatur. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create donation
  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendStatus === 'error') {
      alert('Mode demo: Data donasi tidak dapat disimpan secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trpc.createDonation.mutate(donationFormData);
      setIsAddDonationDialogOpen(false);
      resetDonationForm();
      loadDonations(); // Refresh donations
      onDonationsUpdate(); // Refresh overall stats
    } catch (error) {
      console.error('Failed to create donation:', error);
      alert('Gagal mencatat donasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const cashDonations = donations.filter(d => d.type === 'uang').reduce((sum, d) => sum + (d.amount || 0), 0);
  const itemDonations = donations.filter(d => d.type === 'barang').length;

  // Get donor name by ID
  const getDonorName = (donorId: number) => {
    const donor = donors.find(d => d.id === donorId);
    return donor ? donor.full_name : 'Donor tidak ditemukan';
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      {backendStatus === 'error' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>🚧 Mode Demo:</strong> Menampilkan data contoh donatur dan donasi. 
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
                <Heart className="h-5 w-5 text-red-600" />
                <span>💝 Manajemen Donasi</span>
              </CardTitle>
              <CardDescription>
                Kelola donatur dan donasi yang masuk ke panti asuhan
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isAddDonorDialogOpen} onOpenChange={setIsAddDonorDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Tambah Donatur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>➕ Tambah Donatur Baru</DialogTitle>
                    <DialogDescription>
                      Daftarkan donatur baru ke dalam sistem
                      {backendStatus === 'error' && (
                        <span className="block mt-2 text-amber-600">
                          ⚠️ Mode demo: Data tidak akan tersimpan permanen
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateDonor} className="space-y-4">
                    <div>
                      <Label htmlFor="donor_name">Nama Lengkap *</Label>
                      <Input
                        id="donor_name"
                        value={donorFormData.full_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDonorFormData((prev: CreateDonorInput) => ({ ...prev, full_name: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
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

                    <div>
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

                    <div>
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

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDonorDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDonationDialogOpen} onOpenChange={setIsAddDonationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Catat Donasi
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>📝 Catat Donasi Baru</DialogTitle>
                    <DialogDescription>
                      Catat donasi yang baru diterima
                      {backendStatus === 'error' && (
                        <span className="block mt-2 text-amber-600">
                          ⚠️ Mode demo: Data tidak akan tersimpan permanen
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateDonation} className="space-y-4">
                    <div>
                      <Label>Donatur *</Label>
                      <Select
                        value={donationFormData.donor_id > 0 ? donationFormData.donor_id.toString() : ''}
                        onValueChange={(value: string) =>
                          setDonationFormData((prev: CreateDonationInput) => ({
                            ...prev,
                            donor_id: parseInt(value)
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih donatur" />
                        </SelectTrigger>
                        <SelectContent>
                          {donors.map((donor: Donor) => (
                            <SelectItem key={donor.id} value={donor.id.toString()}>
                              {donor.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Jenis Donasi *</Label>
                      <Select
                        value={donationFormData.type}
                        onValueChange={(value: DonationType) =>
                          setDonationFormData((prev: CreateDonationInput) => ({ ...prev, type: value }))
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

                    {donationFormData.type === 'uang' ? (
                      <div>
                        <Label htmlFor="amount">Jumlah (Rp) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="1000"
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
                    ) : (
                      <>
                        <div>
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
                            required={donationFormData.type === 'barang'}
                          />
                        </div>
                        <div>
                          <Label htmlFor="item_quantity">Jumlah Barang</Label>
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="estimated_value">Estimasi Nilai (Rp)</Label>
                          <Input
                            id="estimated_value"
                            type="number"
                            min="0"
                            step="1000"
                            value={donationFormData.amount || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setDonationFormData((prev: CreateDonationInput) => ({
                                ...prev,
                                amount: parseFloat(e.target.value) || null
                              }))
                            }
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Tanggal Donasi *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(donationFormData.donation_date, "dd MMMM yyyy", { locale: localeId })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={donationFormData.donation_date}
                            onSelect={(date: Date | undefined) => {
                              if (date) {
                                setDonationFormData((prev: CreateDonationInput) => ({ ...prev, donation_date: date }))
                              }
                            }}
                            disabled={(date: Date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
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
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDonationDialogOpen(false)}>
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
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                Rp {totalDonations.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-green-600">Total Donasi Bulan Ini</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                Rp {cashDonations.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-blue-600">💰 Donasi Uang</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{itemDonations}</div>
              <div className="text-sm text-purple-600">📦 Donasi Barang</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{donors.length}</div>
              <div className="text-sm text-red-600">👥 Total Donatur</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="donations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donations" className="flex items-center space-x-2">
            <Gift className="h-4 w-4" />
            <span>Riwayat Donasi</span>
          </TabsTrigger>
          <TabsTrigger value="donors" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Data Donatur</span>
          </TabsTrigger>
        </TabsList>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="🔍 Cari donatur..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Jenis Donasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="uang">💰 Uang</SelectItem>
                <SelectItem value="barang">📦 Barang</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Donations List */}
          {filteredDonations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || typeFilter !== 'all' 
                    ? 'Tidak ada donasi yang sesuai dengan filter.'
                    : (backendStatus === 'error' 
                        ? 'Mode demo: Silakan refresh halaman untuk melihat data contoh.'
                        : 'Belum ada donasi bulan ini.'
                      )
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredDonations.map((donation: Donation) => (
                <Card key={donation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{getDonorName(donation.donor_id)}</h3>
                          <Badge variant={donation.type === 'uang' ? 'default' : 'secondary'}>
                            {donation.type === 'uang' ? '💰 Uang' : '📦 Barang'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            📅 {format(new Date(donation.donation_date), "dd MMMM yyyy", { locale: localeId })}
                          </p>
                          
                          {donation.type === 'uang' ? (
                            <p className="font-medium text-green-600">
                              💰 Rp {donation.amount?.toLocaleString('id-ID') || '0'}
                            </p>
                          ) : (
                            <div>
                              <p>📦 {donation.item_description}</p>
                              {donation.item_quantity && (
                                <p>Jumlah: {donation.item_quantity}</p>
                              )}
                              {donation.amount && (
                                <p className="text-green-600">
                                  Estimasi nilai: Rp {donation.amount.toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {donation.notes && (
                            <p className="text-gray-500">💬 {donation.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Dicatat: {format(new Date(donation.created_at), "dd/MM HH:mm")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Donors Tab */}
        <TabsContent value="donors" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="🔍 Cari donatur..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Donors List */}
          {filteredDonors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Tidak ada donatur yang sesuai dengan pencarian.'
                    : (backendStatus === 'error' 
                        ? 'Mode demo: Silakan refresh halaman untuk melihat data contoh.'
                        : 'Belum ada donatur terdaftar.'
                      )
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDonors.map((donor: Donor) => (
                <Card key={donor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{donor.full_name}</h3>
                      
                      {donor.email && (
                        <p className="text-sm text-gray-600">
                          ✉️ {donor.email}
                        </p>
                      )}
                      
                      {donor.phone && (
                        <p className="text-sm text-gray-600">
                          📞 {donor.phone}
                        </p>
                      )}
                      
                      {donor.address && (
                        <p className="text-sm text-gray-600">
                          📍 {donor.address}
                        </p>
                      )}
                      
                      <div className="pt-2 text-xs text-gray-400">
                        Terdaftar: {format(new Date(donor.created_at), "dd MMM yyyy", { locale: localeId })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
