
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
  DollarSign, 
  Plus, 
  Calendar as CalendarIcon,
  Search,
  Filter,
  TrendingDown,
  FileText,
  PieChart,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { Expense, CreateExpenseInput, ExpenseCategory } from '../../../server/src/schema';

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

interface FinancialManagementProps {
  onExpensesUpdate: () => void;
  backendStatus: 'loading' | 'connected' | 'error';
}

export function FinancialManagement({ onExpensesUpdate, backendStatus }: FinancialManagementProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state for creating expenses
  const [expenseFormData, setExpenseFormData] = useState<CreateExpenseInput>({
    category: 'makanan',
    description: '',
    amount: 0,
    expense_date: new Date(),
    receipt_url: null,
    notes: null,
    created_by: 1, // TODO: Replace with actual user ID from auth context
  });

  // Load expenses and financial report for current month
  const loadExpenses = useCallback(async () => {
    if (backendStatus === 'error') {
      // Use demo expenses data
      const demoExpenses: Expense[] = [
        {
          id: 1,
          category: 'makanan',
          description: 'Belanja sembako bulanan',
          amount: 5500000,
          expense_date: new Date('2024-01-10'),
          receipt_url: null,
          notes: 'Beras, minyak, gula, dan kebutuhan pokok lainnya',
          created_by: 1,
          created_at: new Date('2024-01-10'),
        },
        {
          id: 2,
          category: 'pendidikan',
          description: 'Buku dan alat tulis sekolah',
          amount: 3000000,
          expense_date: new Date('2024-01-15'),
          receipt_url: null,
          notes: 'Persiapan tahun ajaran baru',
          created_by: 1,
          created_at: new Date('2024-01-15'),
        },
        {
          id: 3,
          category: 'kesehatan',
          description: 'Medical check-up anak-anak',
          amount: 1500000,
          expense_date: new Date('2024-01-20'),
          receipt_url: null,
          notes: 'Pemeriksaan kesehatan rutin bulanan',
          created_by: 1,
          created_at: new Date('2024-01-20'),
        },
        {
          id: 4,
          category: 'operasional',
          description: 'Listrik dan air bulan Januari',
          amount: 1800000,
          expense_date: new Date('2024-01-25'),
          receipt_url: null,
          notes: 'Tagihan utilitas bulanan',
          created_by: 1,
          created_at: new Date('2024-01-25'),
        },
        {
          id: 5,
          category: 'lainnya',
          description: 'Perbaikan atap bocor',
          amount: 700000,
          expense_date: new Date('2024-01-30'),
          receipt_url: null,
          notes: 'Perbaikan darurat',
          created_by: 1,
          created_at: new Date('2024-01-30'),
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

      setExpenses(demoExpenses);
      setFinancialReport(demoFinancialReport);
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

      const [expensesData, reportData] = await Promise.all([
        trpc.getExpensesByDateRange.query({
          start_date: startOfMonth,
          end_date: endOfMonth,
        }),
        trpc.getFinancialReport.query({
          start_date: startOfMonth,
          end_date: endOfMonth,
        }),
      ]);

      setExpenses(expensesData);
      setFinancialReport(reportData);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  }, [backendStatus]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Reset form
  const resetExpenseForm = useCallback(() => {
    setExpenseFormData({
      category: 'makanan',
      description: '',
      amount: 0,
      expense_date: new Date(),
      receipt_url: null,
      notes: null,
      created_by: 1,
    });
  }, []);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense: Expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handle create expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendStatus === 'error') {
      alert('Mode demo: Data pengeluaran tidak dapat disimpan secara permanen. Fitur ini akan aktif setelah backend terintegrasi.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await trpc.createExpense.mutate(expenseFormData);
      setIsAddExpenseDialogOpen(false);
      resetExpenseForm();
      loadExpenses(); // Refresh expenses
      onExpensesUpdate(); // Refresh overall stats
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Gagal mencatat pengeluaran. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Category labels and colors
  const categoryLabels = {
    'makanan': '🍽️ Makanan',
    'pendidikan': '📚 Pendidikan',
    'kesehatan': '🏥 Kesehatan',
    'operasional': '⚙️ Operasional',
    'lainnya': '📝 Lainnya'
  };

  const categoryColors = {
    'makanan': 'bg-green-50 text-green-700',
    'pendidikan': 'bg-blue-50 text-blue-700',
    'kesehatan': 'bg-red-50 text-red-700',
    'operasional': 'bg-purple-50 text-purple-700',
    'lainnya': 'bg-gray-50 text-gray-700'
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      {backendStatus === 'error' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>🚧 Mode Demo:</strong> Menampilkan data contoh pengeluaran dan laporan keuangan. 
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
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>💰 Manajemen Keuangan</span>
              </CardTitle>
              <CardDescription>
                Kelola pengeluaran dan laporan keuangan panti asuhan
              </CardDescription>
            </div>
            <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Catat Pengeluaran
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>📝 Catat Pengeluaran Baru</DialogTitle>
                  <DialogDescription>
                    Catat pengeluaran operasional panti asuhan
                    {backendStatus === 'error' && (
                      <span className="block mt-2 text-amber-600">
                        ⚠️ Mode demo: Data tidak akan tersimpan permanen
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div>
                    <Label>Kategori Pengeluaran *</Label>
                    <Select
                      value={expenseFormData.category || 'makanan'}
                      onValueChange={(value: ExpenseCategory) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="makanan">🍽️ Makanan</SelectItem>
                        <SelectItem value="pendidikan">📚 Pendidikan</SelectItem>
                        <SelectItem value="kesehatan">🏥 Kesehatan</SelectItem>
                        <SelectItem value="operasional">⚙️ Operasional</SelectItem>
                        <SelectItem value="lainnya">📝 Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi Pengeluaran *</Label>
                    <Input
                      id="description"
                      value={expenseFormData.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({ ...prev, description: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Jumlah (Rp) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="1000"
                      value={expenseFormData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Tanggal Pengeluaran *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(expenseFormData.expense_date, "dd MMMM yyyy", { locale: localeId })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expenseFormData.expense_date}
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              setExpenseFormData((prev: CreateExpenseInput) => ({ ...prev, expense_date: date }))
                            }
                          }}
                          disabled={(date: Date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="receipt_url">URL Bukti Pembayaran</Label>
                    <Input
                      id="receipt_url"
                      type="url"
                      value={expenseFormData.receipt_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({
                          ...prev,
                          receipt_url: e.target.value || null
                        }))
                      }
                      placeholder="https://example.com/receipt.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expense_notes">Catatan</Label>
                    <Textarea
                      id="expense_notes"
                      value={expenseFormData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({
                          ...prev,
                          notes: e.target.value || null
                        }))
                      }
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
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
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                Rp {totalExpenses.toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-red-600">Total Pengeluaran</div>
            </div>
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className={`p-4 rounded-lg text-center ${categoryColors[category as keyof typeof categoryColors]}`}>
                <div className="text-xl font-bold">
                  Rp {amount.toLocaleString('id-ID')}
                </div>
                <div className="text-sm">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses" className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4" />
            <span>Riwayat Pengeluaran</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Laporan Keuangan</span>
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="🔍 Cari pengeluaran..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="makanan">🍽️ Makanan</SelectItem>
                <SelectItem value="pendidikan">📚 Pendidikan</SelectItem>
                <SelectItem value="kesehatan">🏥 Kesehatan</SelectItem>
                <SelectItem value="operasional">⚙️ Operasional</SelectItem>
                <SelectItem value="lainnya">📝 Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Tidak ada pengeluaran yang sesuai dengan filter.'
                    : (backendStatus === 'error' 
                        ? 'Mode demo: Silakan refresh halaman untuk melihat data contoh.'
                        : 'Belum ada pengeluaran bulan ini.'
                      )
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredExpenses.map((expense: Expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{expense.description}</h3>
                          <Badge className={categoryColors[expense.category]}>
                            {categoryLabels[expense.category]}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            📅 {format(new Date(expense.expense_date), "dd MMMM yyyy", { locale: localeId })}
                          </p>
                          
                          <p className="font-medium text-red-600">
                            💸 Rp {expense.amount.toLocaleString('id-ID')}
                          </p>
                          
                          {expense.notes && (
                            <p className="text-gray-500">💬 {expense.notes}</p>
                          )}
                          
                          {expense.receipt_url && (
                            <p>
                              <a 
                                href={expense.receipt_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                📎 Lihat Bukti Pembayaran
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Dicatat: {format(new Date(expense.created_at), "dd/MM HH:mm")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {financialReport ? (
            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-600">💰 Total Donasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      Rp {financialReport.total_donations.toLocaleString('id-ID')}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      <div>Uang: Rp {financialReport.donations_by_type.uang.toLocaleString('id-ID')}</div>
                      <div>Barang: Rp {financialReport.donations_by_type.barang.toLocaleString('id-ID')}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-red-600">💸 Total Pengeluaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      Rp {financialReport.total_expenses.toLocaleString('id-ID')}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">📊 Saldo Bersih</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${financialReport.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rp {financialReport.balance.toLocaleString('id-ID')}
                    </div>
                    {financialReport.balance < 0 && (
                      <div className="text-sm text-red-500 mt-1">
                        ⚠️ Defisit keuangan
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>📊 Rincian Pengeluaran per Kategori</span>
                  </CardTitle>
                  <CardDescription>
                    Distribusi pengeluaran bulan {format(new Date(), "MMMM yyyy", { locale: localeId })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(financialReport.expenses_by_category).map(([category, amount]) => {
                      const percentage = financialReport.total_expenses > 0 
                        ? ((amount as number) / financialReport.total_expenses) * 100 
                        : 0;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </span>
                            <span className="text-sm font-bold">
                              Rp {(amount as number).toLocaleString('id-ID')} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>📋 Export Laporan</span>
                  </CardTitle>
                  <CardDescription>
                    Unduh laporan keuangan dalam berbagai format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button variant="outline" disabled={backendStatus === 'error'}>
                      📊 Export ke Excel
                    </Button>
                    <Button variant="outline" disabled={backendStatus === 'error'}>
                      📄 Export ke PDF
                    </Button>
                    <Button variant="outline" disabled={backendStatus === 'error'}>
                      📧 Kirim Email
                    </Button>
                  </div>
                  {backendStatus === 'error' && (
                    <p className="text-xs text-amber-600 mt-2">
                      Export akan tersedia setelah backend terintegrasi
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Memuat laporan keuangan...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
