
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Cake,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import type { Child } from '../../../server/src/schema';

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

interface DashboardOverviewProps {
  stats: {
    totalChildren: number;
    totalDonors: number;
    monthlyDonations: number;
    monthlyExpenses: number;
  };
  financialReport: FinancialReport | null;
  children: Child[];
  onRefresh: () => void;
  backendStatus: 'loading' | 'connected' | 'error';
}

export function DashboardOverview({ stats, financialReport, children, onRefresh, backendStatus }: DashboardOverviewProps) {
  // Calculate upcoming birthdays (next 30 days)
  const upcomingBirthdays = children.filter(child => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    const birthThisYear = new Date(today.getFullYear(), child.birth_date.getMonth(), child.birth_date.getDate());
    const birthNextYear = new Date(today.getFullYear() + 1, child.birth_date.getMonth(), child.birth_date.getDate());
    
    return (birthThisYear >= today && birthThisYear <= nextMonth) || 
           (birthNextYear >= today && birthNextYear <= nextMonth);
  });

  // Calculate balance percentage
  const balancePercentage = stats.monthlyDonations > 0 
    ? Math.min(100, (stats.monthlyDonations / (stats.monthlyDonations + stats.monthlyExpenses)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              🌟 Selamat Datang di Dashboard Panti Asuhan
            </h2>
            <p className="text-indigo-100">
              Kelola dan pantau seluruh kegiatan panti asuhan dalam satu tempat
            </p>
            {backendStatus === 'error' && (
              <div className="mt-3 flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-yellow-200 text-sm">
                  Mode Demo: Menampilkan data contoh untuk demonstrasi
                </span>
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={onRefresh} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Perbarui Data</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Anak Asuh
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.totalChildren}</div>
            <p className="text-xs text-blue-600">
              👶 Anak-anak yang diasuh saat ini
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Total Donatur
            </CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{stats.totalDonors}</div>
            <p className="text-xs text-red-600">
              💝 Orang yang telah berdonasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Donasi Bulan Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              Rp {stats.monthlyDonations.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-green-600">
              📈 Total donasi yang diterima
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Pengeluaran Bulan Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              Rp {stats.monthlyExpenses.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-orange-600">
              💸 Total pengeluaran operasional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      {financialReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>💰 Ringkasan Keuangan Bulan Ini</span>
              </CardTitle>
              <CardDescription>
                Status keuangan dan distribusi pengeluaran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Keseimbangan Keuangan</span>
                  <span className="text-sm text-gray-600">{balancePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={balancePercentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  Perbandingan donasi terhadap total dana
                </p>
              </div>

              {/* Balance Amount */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Saldo Bersih</p>
                  <p className={`text-2xl font-bold ${financialReport.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rp {financialReport.balance.toLocaleString('id-ID')}
                  </p>
                  {financialReport.balance < 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Pengeluaran melebihi donasi
                    </p>
                  )}
                </div>
              </div>

              {/* Donation Types */}
              <div>
                <p className="text-sm font-medium mb-2">Donasi per Jenis:</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">💰 Uang</span>
                    <span className="text-sm font-medium">
                      Rp {financialReport.donations_by_type.uang.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">📦 Barang</span>
                    <span className="text-sm font-medium">
                      Rp {financialReport.donations_by_type.barang.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <span>📊 Distribusi Pengeluaran</span>
              </CardTitle>
              <CardDescription>
                Kategori pengeluaran bulan ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(financialReport.expenses_by_category).map(([category, amount]) => {
                  const percentage = stats.monthlyExpenses > 0 ? ((amount as number) / stats.monthlyExpenses) * 100 : 0;
                  const categoryLabels = {
                    makanan: '🍽️ Makanan',
                    pendidikan: '📚 Pendidikan',
                    kesehatan: '🏥 Kesehatan',
                    operasional: '⚙️ Operasional',
                    lainnya: '📝 Lainnya'
                  };

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                        <span className="font-medium">
                          Rp {(amount as number).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-gray-500">{percentage.toFixed(1)}% dari total</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cake className="h-5 w-5 text-pink-600" />
              <span>🎂 Ulang Tahun Mendatang</span>
            </CardTitle>
            <CardDescription>
              Anak asuh yang berulang tahun dalam 30 hari ke depan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Tidak ada ulang tahun dalam 30 hari ke depan
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBirthdays.slice(0, 5).map((child: Child) => {
                  const birthDate = new Date(child.birth_date);
                  const thisYearBirth = new Date(new Date().getFullYear(), birthDate.getMonth(), birthDate.getDate());
                  
                  return (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{child.full_name}</p>
                        <p className="text-xs text-gray-600">
                          {thisYearBirth.toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                        🎉
                      </Badge>
                    </div>
                  );
                })}
                {upcomingBirthdays.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{upcomingBirthdays.length - 5} ulang tahun lainnya
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span>⚠️ Pemberitahuan Sistem</span>
            </CardTitle>
            <CardDescription>
              Status sistem dan pengingat penting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Demo Mode Alert */}
              {backendStatus === 'error' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Mode Demo Aktif
                      </p>
                      <p className="text-xs text-blue-600">
                        Menampilkan data contoh untuk demonstrasi fitur
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Alert */}
              {financialReport && financialReport.balance < 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Defisit Keuangan
                      </p>
                      <p className="text-xs text-red-600">
                        Pengeluaran melebihi donasi bulan ini
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Low donation alert */}
              {stats.monthlyDonations < 1000000 && backendStatus !== 'error' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Heart className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Donasi Rendah
                      </p>
                      <p className="text-xs text-amber-600">
                        Perlu meningkatkan upaya penggalangan dana
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Positive message when no alerts */}
              {(!financialReport || financialReport.balance >= 0) && stats.monthlyDonations >= 1000000 && backendStatus === 'connected' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-green-600 mt-0.5">✅</div>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Sistem Berjalan Lancar
                      </p>
                      <p className="text-xs text-green-600">
                        Tidak ada peringatan saat ini
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup reminder */}
              {backendStatus === 'connected' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Backup Data
                      </p>
                      <p className="text-xs text-blue-600">
                        Jangan lupa backup data secara rutin
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
