
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { StudentPermit } from '@/types/attendance';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PermitLetterProps {
  permit: StudentPermit & { 
    student: { 
      full_name: string; 
      nis: string;
      current_class?: { name: string; major?: { name: string } };
    } 
  };
}

export const PermitLetter = ({ permit }: PermitLetterProps) => {
  const generateLetterHTML = () => {
    const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Surat Dispensasi</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              color: #000;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 18px;
              font-weight: bold;
              margin: 5px 0;
            }
            .school-address {
              font-size: 12px;
              margin: 2px 0;
            }
            .letter-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin: 30px 0 20px 0;
              text-decoration: underline;
            }
            .letter-number {
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              margin: 20px 0;
              text-align: justify;
            }
            .student-info {
              margin: 20px 0;
              padding-left: 40px;
            }
            .student-info table {
              border-collapse: collapse;
            }
            .student-info td {
              padding: 3px 0;
              vertical-align: top;
            }
            .student-info td:first-child {
              width: 120px;
            }
            .student-info td:nth-child(2) {
              width: 20px;
              text-align: center;
            }
            .signature {
              margin-top: 50px;
              float: right;
              text-align: center;
              width: 200px;
            }
            .signature-space {
              height: 80px;
            }
            .clearfix {
              clear: both;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">SMK NEGERI 1 CONTOH</div>
            <div class="school-address">Jl. Pendidikan No. 123, Kota Contoh 12345</div>
            <div class="school-address">Telp: (021) 1234567 | Email: info@smkn1contoh.sch.id</div>
          </div>

          <div class="letter-title">SURAT DISPENSASI</div>
          <div class="letter-number">Nomor: ${permit.id.slice(0, 8)}/DISP/${new Date().getFullYear()}</div>

          <div class="content">
            <p>Yang bertanda tangan di bawah ini, Kepala SMK Negeri 1 Contoh, dengan ini memberikan dispensasi kepada:</p>
            
            <div class="student-info">
              <table>
                <tr>
                  <td>Nama</td>
                  <td>:</td>
                  <td>${permit.student.full_name}</td>
                </tr>
                <tr>
                  <td>NIS</td>
                  <td>:</td>
                  <td>${permit.student.nis}</td>
                </tr>
                <tr>
                  <td>Kelas</td>
                  <td>:</td>
                  <td>${permit.student.current_class?.name || '-'}</td>
                </tr>
                <tr>
                  <td>Jurusan</td>
                  <td>:</td>
                  <td>${permit.student.current_class?.major?.name || '-'}</td>
                </tr>
                <tr>
                  <td>Jenis Izin</td>
                  <td>:</td>
                  <td>${permit.permit_type === 'sick' ? 'Sakit' : 
                       permit.permit_type === 'family_emergency' ? 'Keperluan Keluarga' :
                       permit.permit_type === 'medical_checkup' ? 'Pemeriksaan Kesehatan' :
                       permit.permit_type === 'competition' ? 'Lomba/Kompetisi' :
                       permit.permit_type === 'other' ? 'Lainnya' : permit.permit_type}</td>
                </tr>
                <tr>
                  <td>Tanggal</td>
                  <td>:</td>
                  <td>${format(new Date(permit.start_date), 'dd MMMM yyyy', { locale: id })} 
                      ${permit.start_date !== permit.end_date ? 
                        `s.d. ${format(new Date(permit.end_date), 'dd MMMM yyyy', { locale: id })}` : ''}</td>
                </tr>
                <tr>
                  <td>Alasan</td>
                  <td>:</td>
                  <td>${permit.reason}</td>
                </tr>
              </table>
            </div>

            <p>Demikian surat dispensasi ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
          </div>

          <div class="signature">
            <p>${today}</p>
            <p>Kepala Sekolah</p>
            <div class="signature-space"></div>
            <p><strong>________________</strong></p>
            <p>NIP. ________________</p>
          </div>
          
          <div class="clearfix"></div>
        </body>
      </html>
    `;
  };

  const printLetter = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateLetterHTML());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const downloadLetter = () => {
    const html = generateLetterHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surat-dispensasi-${permit.student.nis}-${permit.id.slice(0, 8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={printLetter}
        title="Cetak Surat Dispensasi"
      >
        <Printer className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={downloadLetter}
        title="Download Surat Dispensasi"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
