
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Heart, 
  Wallet, 
  Calendar, 
  UserPlus, 
  Bell,
  Home,
  Gift
} from 'lucide-react';
import type { UserRole } from '../../server/src/schema';

// Components
import { ChildrenManagement } from '@/components/ChildrenManagement';
import { DonationManagement } from '@/components/DonationManagement';
import { FinanceManagement } from '@/components/FinanceManagement';
import { ActivityManagement } from '@/components/ActivityManagement';
import { DashboardOverview } from '@/components/DashboardOverview';
import { UserManagement } from '@/components/UserManagement';

interface CurrentUser {
  id: number;
  full_name: string;
  role: UserRole;
  email: string;
}

function App() {
  // Authentication state - In real app, this would come from auth context
  const [currentUser] = useState<CurrentUser>({
    id: 1,
    full_name: 'Admin Panti Asuhan',
    role: 'admin',
    email: 'admin@panti.com'
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Sidebar navigation items based on user role
  const getNavigationItems = (role: UserRole) => {
    const allItems = [
      { id: 'dashboard', label: '🏠 Dashboard', icon: Home },
      { id: 'children', label: '👶 Anak Asuh', icon: Users },
      { id: 'donations', label: '💝 Donasi', icon: Gift },
      { id: 'finance', label: '💰 Keuangan', icon: Wallet },
      { id: 'activities', label: '📅 Kegiatan', icon: Calendar },
      { id: 'users', label: '👥 Pengguna', icon: UserPlus },
    ];

    // Filter based on role
    if (role === 'donatur') {
      return allItems.filter(item => ['dashboard', 'donations', 'activities'].includes(item.id));
    }
    if (role === 'pengurus') {
      return allItems.filter(item => item.id !== 'users');
    }
    return allItems; // admin gets all items
  };

  const navigationItems = getNavigationItems(currentUser.role);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview currentUser={currentUser} />;
      case 'children':
        return <ChildrenManagement currentUser={currentUser} />;
      case 'donations':
        return <DonationManagement currentUser={currentUser} />;
      case 'finance':
        return <FinanceManagement currentUser={currentUser} />;
      case 'activities':
        return <ActivityManagement currentUser={currentUser} />;
      case 'users':
        return currentUser.role === 'admin' ? <UserManagement currentUser={currentUser} /> : null;
      default:
        return <DashboardOverview currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistem Panti Asuhan</h1>
                <p className="text-sm text-gray-500">Manajemen Komprehensif Panti Asuhan</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Bell className="h-4 w-4 mr-2" />
                Notifikasi
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {currentUser.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{currentUser.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {currentUser.role === 'admin' ? 'Administrator' : 
                     currentUser.role === 'pengurus' ? 'Pengurus' : 'Donatur'}
                  </p>
                </div>
                <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {currentUser.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg h-[calc(100vh-80px)] sticky top-[80px]">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6">
          {renderTabContent()}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="px-6 py-4 text-center text-sm text-gray-500">
          © 2024 Sistem Manajemen Panti Asuhan - Dibuat dengan ❤️ untuk anak-anak Indonesia
        </div>
      </footer>
    </div>
  );
}

export default App;
