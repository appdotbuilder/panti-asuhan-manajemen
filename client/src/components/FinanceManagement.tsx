
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
  Wallet, 
  Plus,
  Calendar as CalendarIcon, 
  Search,
  TrendingUp,
  TrendingDown,
  PieChart,
  Receipt,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { trpc } from '@/utils/trpc';
import type { 
  Expense, 
  CreateExpenseInput, 
  UserRole,
  ExpenseCategory
} from '../../../server/src/schema';
import type { FinancialReport } from '../../../server/src/handlers/get_financial_report';

interface FinanceManagementProps {
  currentUser: {
    id: number;
    full_name: string;
    role: UserRole;
    email: string;
  };
}

export function FinanceManagement({ currentUser }: FinanceManagementProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  
  // Date range for filtering
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Dialog states
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [expenseFormData, setExpenseFormData] = useState<CreateExpenseInput>({
    category: 'makanan',
    description: '',
    amount: 0,
    expense_date: new Date(),
    receipt_url: null,
    notes: null,
    created_by: currentUser.id,
  });

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getExpensesByDateRange.query({
        start_date: startDate,
        end_date: endDate,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setExpenses(result);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, categoryFilter]);

  const loadFinancialReport = useCallback(async () => {
    try {
      const report = await trpc.getFinancialReport.query({
        start_date: startDate,
        end_date: endDate,
      });
      setFinancialReport(report);
    } catch (error) {
      console.error('Failed to load financial report:', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadExpenses();
    loadFinancialReport();
  }, [loadExpenses, loadFinancialReport]);

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newExpense = await trpc.createExpense.mutate(expenseFormData);
      setExpenses((prev: Expense[]) => [...prev, newExpense]);
      setIsExpenseDialogOpen(false);
      setExpenseFormData({
        category: 'makanan',
        description: '',
        amount: 0,
        expense_date: new Date(),
        receipt_url: null,
        notes: null,
        created_by: currentUser.id,
      });
      // Reload financial report
      loadFinancialReport();
    } catch (error) {
      console.error('Failed to create expense:', error);
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

  const getCategoryLabel = (category: ExpenseCategory) => {
    const labels: Record<ExpenseCategory, string> = {
      makanan: '🍽️ Makanan',
      pendidikan: '📚 Pendidikan',
      kesehatan: '🏥 Kesehatan',
      operasional: '⚙️ Operasional',
      lainnya: '📋 Lainnya'
    };
    return labels[category];
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    const icons: Record<ExpenseCategory, string> = {
      makanan: '🍽️',
      pendidikan: '📚',
      kesehatan: '🏥',
      operasional: '⚙️',
      lainnya: '📋'
    };
    return icons[category];
  };

  const calculateCategoryStats = () => {
    const categoryTotals: Record<ExpenseCategory, number> = {
      makanan: 0,
      pendidikan: 0,
      kesehatan: 0,
      operasional: 0,
      lainnya: 0,
    };

    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] += expense.amount;
    });

    return categoryTotals;
  };

  const categoryStats = calculateCategoryStats();
  const totalExpenses = Object.values(categoryStats).reduce((sum, amount) => sum + amount, 0);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'pengurus';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">💰 Manajemen Keuangan</h2>
          <p className="text-gray-600 mt-1">
            Kelola pengeluaran dan laporan keuangan panti asuhan
          </p>
        </div>
        
        {canManage && (
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Catat Pengeluaran
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan catatan pengeluaran panti asuhan
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateExpense}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Select
                      value={expenseFormData.category || 'makanan'}
                      onValueChange={(value: ExpenseCategory) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          category: value 
                        }))
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
                        <SelectItem value="lainnya">📋 Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi *</Label>
                    <Input
                      id="description"
                      value={expenseFormData.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          description: e.target.value 
                        }))
                      }
                      placeholder="Contoh: Pembelian beras 25kg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah (Rupiah) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
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

                  <div className="space-y-2">
                    <Label>Tanggal Pengeluaran *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(expenseFormData.expense_date, 'dd MMMM yyyy', { locale: id })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expenseFormData.expense_date}
                          onSelect={(date: Date | undefined) =>
                            date && setExpenseFormData((prev: CreateExpenseInput) => ({ 
                              ...prev, 
                              expense_date: date 
                            }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt_url">URL Struk/Bukti (Opsional)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      value={expenseFormData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setExpenseFormData((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          notes: e.target.value || null 
                        }))
                      }
                      placeholder="Catatan tambahan tentang pengeluaran"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Financial Overview */}
      {financialReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Donasi</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(financialReport.total_donations)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(financialReport.total_expenses)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${financialReport.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${financialReport.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {financialReport.balance >= 0 ? 'Surplus' : 'Defisit'}
                  </p>
                  <p className={`text-2xl font-bold ${financialReport.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                    {formatCurrency(Math.abs(financialReport.balance))}
                  </p>
                </div>
                {financialReport.balance >= 0 ? (
                  <Target className="h-8 w-8 text-blue-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari deskripsi pengeluaran..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={(value: 'all' | ExpenseCategory) => setCategoryFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="makanan">🍽️ Makanan</SelectItem>
                <SelectItem value="pendidikan">📚 Pendidikan</SelectItem>
                <SelectItem value="kesehatan">🏥 Kesehatan</SelectItem>
                <SelectItem value="operasional">⚙️ Operasional</SelectItem>
                <SelectItem value="lainnya">📋 Lainnya</SelectItem>
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

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">📝 Daftar Pengeluaran</TabsTrigger>
          <TabsTrigger value="categories">📊 Per Kategori</TabsTrigger>
          <TabsTrigger value="report">📈 Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          {/* Expenses List */}
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
          ) : filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Tidak ada pengeluaran yang sesuai filter'
                    : 'Belum ada catatan pengeluaran'
                  }
                </h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'Coba ubah kriteria pencarian atau filter'
                    : canManage 
                      ? 'Mulai dengan mencatat pengeluaran pertama'
                      : 'Catatan pengeluaran akan muncul di sini'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExpenses.map((expense: Expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center">
                        <span className="mr-2">{getCategoryIcon(expense.category)}</span>
                        {expense.description}
                      </CardTitle>
                      <Badge variant="secondary">
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {format(expense.expense_date, 'dd MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </div>

                    {expense.notes && (
                      <div className="text-sm">
                        <strong className="text-gray-700">Catatan:</strong>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {expense.notes}
                        </p>
                      </div>
                    )}

                    {expense.receipt_url && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Receipt className="h-4 w-4 mr-1" />
                        <a 
                          href={expense.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Lihat Bukti
                        </a>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        Dicatat: {format(expense.created_at, 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          {/* Category Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(categoryStats).map(([category, amount]) => {
              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              
              return (
                <Card key={category} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center">
                      <span className="mr-2">{getCategoryIcon(category as ExpenseCategory)}</span>
                      {getCategoryLabel(category as ExpenseCategory)}
                    </CardTitle>
                    <CardDescription>
                      {percentage.toFixed(1)}% dari total pengeluaran
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(amount)}
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          {filteredExpenses.filter(e => e.category === category).length} transaksi
                        </span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="report">
          {/* Financial Report */}
          {financialReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                    Ringkasan Keuangan
                  </CardTitle>
                  <CardDescription>
                    Periode: {financialReport.period}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-4">💰 Pemasukan (Donasi)</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Total Donasi Uang</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(financialReport.donations_by_type.uang)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Donasi Barang</span>
                          <span className="font-bold text-blue-600">
                            {financialReport.donations_by_type.barang} item
                          </span>
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center">
                          <span className="font-semibold">Total Pemasukan</span>
                          <span className="font-bold text-green-600 text-lg">
                            {formatCurrency(financialReport.total_donations)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-red-700 mb-4">💸 Pengeluaran per Kategori</h4>
                      <div className="space-y-3">
                        {Object.entries(financialReport.expenses_by_category).map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="flex items-center">
                              <span className="mr-2">{getCategoryIcon(category as ExpenseCategory)}</span>
                              {getCategoryLabel(category as ExpenseCategory).replace(/^.+\s/, '')}
                            </span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t flex justify-between items-center">
                          <span className="font-semibold">Total Pengeluaran</span>
                          <span className="font-bold text-red-600 text-lg">
                            {formatCurrency(financialReport.total_expenses)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <div className="flex justify-between items-center text-xl">
                      <span className="font-bold">
                        {financialReport.balance >= 0 ? '📈 Surplus Akhir' : '📉 Defisit Akhir'}
                      </span>
                      <span className={`font-bold ${financialReport.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financialReport.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(financialReport.balance))}
                      </span>
                    </div>
                    
                    {financialReport.balance < 0 && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-orange-800 text-sm">
                          ⚠️ <strong>Perhatian:</strong> Pengeluaran melebihi donasi. 
                          Pertimbangkan untuk mengurangi pengeluaran atau meningkatkan upaya penggalangan dana.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
