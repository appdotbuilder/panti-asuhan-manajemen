
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Heart, 
  DollarSign, 
  Calendar, 
  PieChart,
  Gift,
  FileText,
  Activity,
  Home,
  Bell,
  Settings,
  AlertCircle
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { ChildrenManagement } from '@/components/ChildrenManagement';
import { DonationManagement } from '@/components/DonationManagement';
import { FinancialManagement } from '@/components/FinancialManagement';
import { ActivityManagement } from '@/components/ActivityManagement';
import { DashboardOverview } from '@/components/DashboardOverview';
import type { Child, Donor } from '../../server/src/schema';

// Define FinancialReport interface locally since it's from handler
interface FinancialReport {
  period: string;
  total_donations: number;
  total_expenses: number;
  balance: number;
  donations_by_type: {
    uang: number;
    barang: number;
  };
  expenses_by_category: {
    makanan: number;
    pendidikan: number;
    kesehatan: number;
    operasional: number;
    lainnya: number;
  };
}

function App() {
  // Dashboard stats state
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalDonors: 0,
    monthlyDonations: 0,
    monthlyExpenses: 0,
  });
  
  const [children, setChildren] = useState<Child[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  // Create demo data function
  const createDemoData = useCallback(() => {
    console.log('Loading demo data...');
    
    const demoChildren: Child[] = [
      {
        id: 1,
        full_name: 'Ahmad Rizki',
        birth_date: new Date('2010-05-15'),
        gender: 'laki-laki',
        education_status: 'sd',
        health_history: 'Sehat, tidak ada riwayat penyakit khusus',
        guardian_info: 'Yatim piatu, diserahkan keluarga jauh',
        notes: 'Anak yang aktif dan cerdas, suka matematika',
        is_active: true,
        created_at: new Date('2023-01-15'),
        updated_at: null,
      },
      {
        id: 2,
        full_name: 'Siti Nurhaliza',
        birth_date: new Date('2012-08-22'),
        gender: 'perempuan',
        education_status: 'sd',
        health_history: null,
        guardian_info: 'Yatim, ibu sakit keras',
        notes: 'Suka menggambar dan bernyanyi',
        is_active: true,
        created_at: new Date('2023-02-20'),
        updated_at: null,
      },
      {
        id: 3,
        full_name: 'Budi Santoso',
        birth_date: new Date('2008-12-10'),
        gender: 'laki-laki',
        education_status: 'smp',
        health_history: 'Asma ringan',
        guardian_info: 'Yatim piatu, tidak ada keluarga',
        notes: 'Berbakat dalam olahraga, terutama sepak bola',
        is_active: true,
        created_at: new Date('2022-11-10'),
        updated_at: null,
      },
    ];

    const demoDonors: Donor[] = [
      {
        id: 1,
        full_name: 'Ibu Sari Wijaya',
        email: 'sari.wijaya@email.com',
        phone: '081234567890',
        address: 'Jl. Kebon Jeruk No. 123, Jakarta',
        user_id: null,
        created_at: new Date('2023-01-05'),
        updated_at: null,
      },
      {
        id: 2,
        full_name: 'Bapak Ahmad Hidayat',
        email: null,
        phone: '087654321098',
        address: 'Jl. Sudirman No. 456, Bandung',
        user_id: null,
        created_at: new Date('2023-02-15'),
        updated_at: null,
      },
      {
        id: 3,
        full_name: 'PT. Karya Mandiri',
        email: 'csr@karyamandiri.co.id',
        phone: '021-55556666',
        address: 'Gedung Mandiri Lt. 10, Jakarta Pusat',
        user_id: null,
        created_at: new Date('2023-01-20'),
        updated_at: null,
      },
    ];

    const demoFinancialReport: FinancialReport = {
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      total_donations: 15750000,
      total_expenses: 12500000,
      balance: 3250000,
      donations_by_type: {
        uang: 12500000,
        barang: 3250000,
      },
      expenses_by_category: {
        makanan: 5500000,
        pendidikan: 3000000,
        kesehatan: 1500000,
        operasional: 1800000,
        lainnya: 700000,
      },
    };

    return { demoChildren, demoDonors, demoFinancialReport };
  }, []);

  // Load initial data with improved error handling
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBackendStatus('loading');

      // First, try a simple healthcheck with a timeout
      let isBackendAvailable = false;
      try {
        console.log('Testing backend connection...');
        const healthResponse = await Promise.race([
          trpc.healthcheck.query(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000) // 3 second timeout
          )
        ]);
        console.log('Backend healthcheck successful:', healthResponse);
        isBackendAvailable = true;
        setBackendStatus('connected');
      } catch (healthError) {
        console.log('Backend healthcheck failed, using demo data:', healthError);
        isBackendAvailable = false;
        setBackendStatus('error');
      }

      if (!isBackendAvailable) {
        // Use demo data immediately
        const { demoChildren, demoDonors, demoFinancialReport } = createDemoData();
        
        setChildren(demoChildren);
        setDonors(demoDonors);
        setFinancialReport(demoFinancialReport);

        // Update stats
        setStats({
          totalChildren: demoChildren.length,
          totalDonors: demoDonors.length,
          monthlyDonations: demoFinancialReport.total_donations,
          monthlyExpenses: demoFinancialReport.total_expenses,
        });

        setError(null); // Clear any errors since we have demo data
        setIsLoading(false);
        return;
      }

      // If backend is available, fetch real data
      try {
        console.log('Fetching real data from backend...');
        const [childrenData, donorsData] = await Promise.all([
          trpc.getChildren.query(),
          trpc.getDonors.query(),
        ]);

        // Get current month's financial report
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const reportData = await trpc.getFinancialReport.query({
          start_date: startOfMonth,
          end_date: endOfMonth,
        });

        setChildren(childrenData);
        setDonors(donorsData);
        setFinancialReport(reportData);

        // Update stats
        setStats({
          totalChildren: childrenData.length,
          totalDonors: donorsData.length,
          monthlyDonations: reportData.total_donations,
          monthlyExpenses: reportData.total_expenses,
        });

        setError(null);
      } catch (dataError) {
        console.error('Failed to fetch real data, falling back to demo:', dataError);
        
        // Fallback to demo data if real data fails
        const { demoChildren, demoDonors, demoFinancialReport } = createDemoData();
        
        setChildren(demoChildren);
        setDonors(demoDonors);
        setFinancialReport(demoFinancialReport);

        setStats({
          totalChildren: demoChildren.length,
          totalDonors: demoDonors.length,
          monthlyDonations: demoFinancialReport.total_donations,
          monthlyExpenses: demoFinancialReport.total_expenses,
        });

        setBackendStatus('error');
        setError(null); // Clear error since we have demo data
      }

    } catch (err) {
      console.error('Critical error in loadData:', err);
      
      // Final fallback to demo data
      const { demoChildren, demoDonors, demoFinancialReport } = createDemoData();
      
      setChildren(demoChildren);
      setDonors(demoDonors);
      setFinancialReport(demoFinancialReport);

      setStats({
        totalChildren: demoChildren.length,
        totalDonors: demoDonors.length,
        monthlyDonations: demoFinancialReport.total_donations,
        monthlyExpenses: demoFinancialReport.total_expenses,
      });

      setBackendStatus('error');
      setError(null); // Clear error since we have demo data
    } finally {
      setIsLoading(false);
    }
  }, [createDemoData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Loading state with timeout fallback
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout, forcing demo data...');
        const { demoChildren, demoDonors, demoFinancialReport } = createDemoData();
        
        setChildren(demoChildren);
        setDonors(demoDonors);
        setFinancialReport(demoFinancialReport);

        setStats({
          totalChildren: demoChildren.length,
          totalDonors: demoDonors.length,
          monthlyDonations: demoFinancialReport.total_donations,
          monthlyExpenses: demoFinancialReport.total_expenses,
        });

        setBackendStatus('error');
        setError(null);
        setIsLoading(false);
      }
    }, 5000); // 5 second max loading time

    return () => clearTimeout(timeoutId);
  }, [isLoading, createDemoData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium mb-2">Memuat aplikasi...</p>
          <p className="text-sm text-gray-600">
            Mencoba menghubungkan ke server. Jika gagal, akan menggunakan mode demo.
          </p>
          <div className="mt-4">
            <Button 
              onClick={() => {
                console.log('Force loading demo data...');
                const { demoChildren, demoDonors, demoFinancialReport } = createDemoData();
                
                setChildren(demoChildren);
                setDonors(demoDonors);
                setFinancialReport(demoFinancialReport);

                setStats({
                  totalChildren: demoChildren.length,
                  totalDonors: demoDonors.length,
                  monthlyDonations: demoFinancialReport.total_donations,
                  monthlyExpenses: demoFinancialReport.total_expenses,
                });

                setBackendStatus('error');
                setError(null);
                setIsLoading(false);
              }}
              variant="outline" 
              size="sm"
            >
              Lanjut ke Mode Demo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Home className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏠 Sistem Manajemen Panti Asuhan
                </h1>
                <p className="text-sm text-gray-600 flex items-center space-x-2">
                  <span>Dashboard Terpadu untuk Pengelolaan Panti Asuhan</span>
                  {backendStatus === 'error' && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                      🚧 Mode Demo
                    </span>
                  )}
                  {backendStatus === 'connected' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      ✅ Terhubung
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifikasi
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Alert */}
      {backendStatus === 'error' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>🚧 Mode Demo Aktif:</strong> Backend sedang dalam pengembangan. 
              Aplikasi menampilkan data contoh untuk demonstrasi fitur-fitur utama. 
              Semua perubahan data hanya tersimpan sementara di browser.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadData}
                className="ml-4"
              >
                Coba Koneksi Lagi
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Error Alert */}
      {error && backendStatus !== 'error' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:flex bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="children" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Anak Asuh</span>
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Donasi</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Keuangan</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Kegiatan</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard">
            <DashboardOverview 
              stats={stats}
              financialReport={financialReport}
              children={children}
              onRefresh={loadData}
              backendStatus={backendStatus}
            />
          </TabsContent>

          {/* Children Management */}
          <TabsContent value="children">
            <ChildrenManagement 
              children={children}
              onChildrenUpdate={loadData}
              backendStatus={backendStatus}
            />
          </TabsContent>

          {/* Donation Management */}
          <TabsContent value="donations">
            <DonationManagement 
              donors={donors}
              onDonationsUpdate={loadData}
              backendStatus={backendStatus}
            />
          </TabsContent>

          {/* Financial Management */}
          <TabsContent value="financial">
            <FinancialManagement 
              onExpensesUpdate={loadData}
              backendStatus={backendStatus}
            />
          </TabsContent>

          {/* Activity Management */}
          <TabsContent value="activities">
            <ActivityManagement 
              backendStatus={backendStatus}
            />
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span>📊 Laporan & Analisis</span>
                  </CardTitle>
                  <CardDescription>
                    Akses berbagai laporan dan analisis data panti asuhan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <PieChart className="h-6 w-6 mb-2 text-blue-600" />
                      <span>Laporan Keuangan</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="h-6 w-6 mb-2 text-green-600" />
                      <span>Data Anak Asuh</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Heart className="h-6 w-6 mb-2 text-red-600" />
                      <span>Laporan Donasi</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Activity className="h-6 w-6 mb-2 text-purple-600" />
                      <span>Laporan Kegiatan</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Gift className="h-6 w-6 mb-2 text-orange-600" />
                      <span>Analisis Donatur</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2 text-indigo-600" />
                      <span>Export Data</span>
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm flex items-center">
                      <span className="mr-2">⚠️</span>
                      {backendStatus === 'error' 
                        ? 'Mode demo: Fitur laporan akan tersedia setelah backend terintegrasi.'
                        : 'Fitur laporan detail sedang dalam pengembangan. Saat ini Anda dapat melihat ringkasan data di Dashboard.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
