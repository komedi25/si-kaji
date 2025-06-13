
import { AppLayout } from '@/components/layout/AppLayout';
import { AchievementVerification } from '@/components/achievements/AchievementVerification';

const AchievementVerificationPage = () => {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Verifikasi Prestasi</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Verifikasi prestasi siswa yang telah diajukan
          </p>
        </div>
        <AchievementVerification />
      </div>
    </AppLayout>
  );
};

export default AchievementVerificationPage;
