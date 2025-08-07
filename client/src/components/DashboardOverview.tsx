
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Heart, 
  Wallet, 
  Calendar, 
  TrendingUp,
  Gift,
  Plus
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Child, Donor, UserRole } from '../../../server/src/schema';
import type { FinancialReport } from '../../../server/src/handlers/get_financial_report';

interface DashboardOverviewProps {
  currentUser: {
    id: number;
    full_name: string;
    role: UserRole;
    email: string;
  };
}

export function DashboardOverview({ currentUser }: DashboardOverviewProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load children data
      const childrenData = await trpc.getChildren.query();
      setChildren(childrenData);

      // Load donors data
      const donorsData = await trpc.getDonors.query();
      setDonors(donorsData);

      // Load financial report for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const reportData = await trpc.getFinancialReport.query({
        start_date: startOfMonth,
        end_date: endOfMonth,
      });
      setFinancialReport(reportData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate stats
  const activeChildren = children.filter(child => child.is_active).length;
  const childrenByEducation = children.reduce((acc, child) => {
    acc[child.education_status] = (acc[child.education_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Upcoming birthdays (next 30 days)
  const upcomingBirthdays = children.filter(child => {
    const today = new Date();
    const birthday = new Date(child.birth_date);
    birthday.setFullYear(today.getFullYear());
    
    const daysDiff = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getEducationStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      belum_sekolah: 'Belum Sekolah',
      tk: 'TK',
      sd: 'SD',
      smp: 'SMP',
      sma: 'SMA',
      kuliah: 'Kuliah',
      lulus: 'Lulus'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Selamat Datang, {currentUser.full_name}! 👋
        </h2>
        <p className="text-blue-100">
          {currentUser.role === 'admin' ? 
            'Kelola semua aspek panti asuhan dari dashboard ini.' :
            currentUser.role === 'pengurus' ?
            'Pantau dan kelola data anak asuh, donasi, dan kegiatan hari ini.' :
            'Lihat laporan donasi Anda dan kegiatan terbaru panti asuhan.'
          }
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-blue-700">
              <span>Anak Asuh Aktif</span>
              <Users className="h-5 w-5" />
            </CardTitle>
            <CardDescription className="text-xl font-bold text-blue-900">
              {activeChildren} Anak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-600">
              Total: {children.length} anak terdaftar
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-green-700">
              <span>Total Donatur</span>
              <Heart className="h-5 w-5" />
            </CardTitle>
            <CardDescription className="text-xl font-bold text-green-900">
              {donors.length} Donatur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600">
              Terima kasih untuk dukungannya! 🙏
            </div>
          </CardContent>
        </Card>

        {financialReport && (
          <>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-purple-700">
                  <span>Donasi Bulan Ini</span>
                  <Gift className="h-5 w-5" />
                </CardTitle>
                <CardDescription className="text-xl font-bold text-purple-900">
                  {formatCurrency(financialReport.total_donations)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-purple-600">
                  Uang: {formatCurrency(financialReport.donations_by_type.uang)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-orange-700">
                  <span>Pengeluaran</span>
                  <Wallet className="h-5 w-5" />
                </CardTitle>
                <CardDescription className="text-xl font-bold text-orange-900">
                  {formatCurrency(financialReport.total_expenses)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-orange-600">
                  Saldo: {formatCurrency(financialReport.balance)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Children Education Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Status Pendidikan Anak
            </CardTitle>
            <CardDescription>
              Distribusi anak asuh berdasarkan status pendidikan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(childrenByEducation).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {getEducationStatusLabel(status)}
                  </span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {count} anak
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Ulang Tahun Mendatang 🎂
            </CardTitle>
            <CardDescription>
              Anak-anak yang berulang tahun dalam 30 hari ke depan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-gray-500 text-sm">Tidak ada ulang tahun dalam 30 hari ke depan</p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.slice(0, 5).map((child) => {
                  const birthday = new Date(child.birth_date);
                  birthday.setFullYear(new Date().getFullYear());
                  
                  return (
                    <div key={child.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{child.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {birthday.toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        🎉
                      </Badge>
                    </div>
                  );
                })}
                {upcomingBirthdays.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{upcomingBirthdays.length - 5} lagi
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      {financialReport && currentUser.role !== 'donatur' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Ringkasan Keuangan Bulan Ini
            </CardTitle>
            <CardDescription>
              {financialReport.period}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3">💰 Pengeluaran per Kategori</h4>
                <div className="space-y-2">
                  {Object.entries(financialReport.expenses_by_category).map(([category, amount]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="capitalize">
                        {category === 'makanan' ? '🍽️ Makanan' :
                         category === 'pendidikan' ? '📚 Pendidikan' :
                         category === 'kesehatan' ? '🏥 Kesehatan' :
                         category === 'operasional' ? '⚙️ Operasional' :
                         '📋 Lainnya'}
                      </span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-700 mb-3">🎁 Donasi per Jenis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>💵 Donasi Uang</span>
                    <span className="font-medium">
                      {formatCurrency(financialReport.donations_by_type.uang)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>📦 Donasi Barang</span>
                    <span className="font-medium">
                      {financialReport.donations_by_type.barang} item
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className={financialReport.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {financialReport.balance >= 0 ? '📈 Surplus' : '📉 Defisit'}
                    </span>
                    <span className={financialReport.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(financialReport.balance))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {currentUser.role !== 'donatur' && (
        <Card>
          <CardHeader>
            <CardTitle>🚀 Aksi Cepat</CardTitle>
            <CardDescription>
              Tindakan yang sering dilakukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 text-center border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <Plus className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Tambah Anak</p>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors">
                <Gift className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Catat Donasi</p>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
                <Wallet className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Input Biaya</p>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Buat Kegiatan</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
