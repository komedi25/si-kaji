
import { AppLayout } from '@/components/layout/AppLayout';
import { AchievementInputForm } from '@/components/achievements/AchievementInputForm';

const AchievementInput = () => {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Input Prestasi Siswa</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Catat prestasi siswa untuk sistem poin disiplin
          </p>
        </div>
        <AchievementInputForm />
      </div>
    </AppLayout>
  );
};

export default AchievementInput;
