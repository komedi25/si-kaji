
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Shield, UserCheck } from 'lucide-react';
import { AllUserData } from '@/types/user';

interface UserStatsProps {
  users: AllUserData[];
}

export const UserStats = ({ users }: UserStatsProps) => {
  const totalUsers = users.length;
  const activeStudents = users.filter(u => u.user_type === 'student').length;
  const staffUsers = users.filter(u => u.user_type === 'staff').length;
  const usersWithAccounts = users.filter(u => u.has_user_account).length;

  const stats = [
    {
      title: 'Total Pengguna',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Staff & Guru',
      value: staffUsers,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Siswa',
      value: activeStudents,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Akun Aktif',
      value: usersWithAccounts,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.title === 'Akun Aktif' 
                  ? `${Math.round((stat.value / totalUsers) * 100)}% dari total`
                  : 'Data terkini'
                }
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
