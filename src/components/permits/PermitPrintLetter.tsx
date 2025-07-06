
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface StudentPermit {
  id: string;
  permit_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  activity_location?: string;
  approved_at: string;
  student: {
    full_name: string;
    nis: string;
    current_class?: { 
      name: string;
      major?: { name: string };
    };
  };
  final_approver?: {
    full_name: string;
    nip: string;
  };
}

interface PermitPrintLetterProps {
  permit: StudentPermit;
  variant?: 'button' | 'icon';
}

export const PermitPrintLetter = ({ permit, variant = 'button' }: PermitPrintLetterProps) => {
  const generateLetterHTML = () => {
    const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
    const permitDate = format(new Date(permit.approved_at), 'dd MMMM yyyy', { locale: id });
    
    const getPermitTypeLabel = (type: string) => {
      const labels: { [key: string]: string } = {
        'sakit': 'Sakit',
        'izin_keluarga': 'Izin Keluarga',
        'dispensasi_akademik': 'Dispensasi Akademik',
        'kegiatan_eksternal': 'Kegiatan Eksternal',
        'izin_pulang_awal': 'Izin Pulang Awal',
        'kegiatan_setelah_jam_sekolah': 'Kegiatan Setelah Jam Sekolah',
        'keperluan_administrasi': 'Keperluan Administrasi',
        'lainnya': 'Lainnya'
      };
      return labels[type] || type;
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Surat Dispensasi - ${permit.student.full_name}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              color: #000;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 10px;
            }
            .school-name {
              font-size: 20px;
              font-weight: bold;
              margin: 5px 0;
              text-transform: uppercase;
            }
            .school-address {
              font-size: 14px;
              margin: 2px 0;
            }
            .letter-title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin: 30px 0 20px 0;
              text-decoration: underline;
              text-transform: uppercase;
            }
            .letter-number {
              text-align: center;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .content {
              margin: 20px 0;
              text-align: justify;
              font-size: 14px;
            }
            .student-info {
              margin: 20px 0;
              padding-left: 0;
            }
            .student-info table {
              border-collapse: collapse;
              width: 100%;
            }
            .student-info td {
              padding: 8px 0;
              vertical-align: top;
            }
            .student-info td:first-child {
              width: 200px;
              font-weight: bold;
            }
            .student-info td:nth-child(2) {
              width: 20px;
              text-align: center;
            }
            .student-info td:nth-child(3) {
              padding-left: 10px;
            }
            .reason-box {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .signature {
              margin-top: 60px;
              float: right;
              text-align: center;
              width: 250px;
            }
            .signature-space {
              height: 100px;
              border-bottom: 1px solid #000;
              margin: 30px 0 10px 0;
            }
            .clearfix {
              clear: both;
            }
            .qr-code {
              position: absolute;
              bottom: 20px;
              left: 20px;
              font-size: 10px;
              color: #666;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 15px;
              }
              .no-print { 
                display: none; 
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">SMK Negeri 1 Kendal</div>
            <div class="school-address">Jl. Sukarno Hatta No. 1, Kendal, Jawa Tengah 51314</div>
            <div class="school-address">Telp: (0294) 381037 | Email: info@smkn1kendal.sch.id</div>
            <div class="school-address">Website: www.smkn1kendal.sch.id</div>
          </div>

          <div class="letter-title">Surat Dispensasi</div>
          <div class="letter-number">Nomor: ${permit.id.substring(0, 8)}/DISP/SMK1KDL/${new Date().getFullYear()}</div>

          <div class="content">
            <p>Yang bertanda tangan di bawah ini, Kepala SMK Negeri 1 Kendal, dengan ini memberikan dispensasi kepada siswa:</p>
            
            <div class="student-info">
              <table>
                <tr>
                  <td>Nama Siswa</td>
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
                  <td>Jenis Dispensasi</td>
                  <td>:</td>
                  <td>${getPermitTypeLabel(permit.permit_type)}</td>
                </tr>
                <tr>
                  <td>Tanggal</td>
                  <td>:</td>
                  <td>
                    ${format(new Date(permit.start_date), 'dd MMMM yyyy', { locale: id })}
                    ${permit.start_date !== permit.end_date ? 
                      `s.d. ${format(new Date(permit.end_date), 'dd MMMM yyyy', { locale: id })}` : ''}
                  </td>
                </tr>
                ${permit.start_time && permit.end_time ? `
                <tr>
                  <td>Waktu</td>
                  <td>:</td>
                  <td>${permit.start_time} - ${permit.end_time} WIB</td>
                </tr>
                ` : ''}
                ${permit.activity_location ? `
                <tr>
                  <td>Lokasi Kegiatan</td>
                  <td>:</td>
                  <td>${permit.activity_location}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div class="reason-box">
              <strong>Alasan Dispensasi:</strong><br>
              ${permit.reason}
            </div>

            <p>Demikian surat dispensasi ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
          </div>

          <div class="signature">
            <p>Kendal, ${permitDate}</p>
            <p><strong>Kepala Sekolah</strong></p>
            <div class="signature-space"></div>
            <p><strong>${permit.final_approver?.full_name || '________________'}</strong></p>
            <p>NIP. ${permit.final_approver?.nip || '________________'}</p>
          </div>
          
          <div class="clearfix"></div>

          <div class="footer">
            <p>Surat ini diterbitkan secara elektronik melalui Sistem Informasi Kesiswaan (Si-Kaji) SMK Negeri 1 Kendal</p>
            <p>ID Dokumen: ${permit.id} | Diterbitkan: ${today}</p>
          </div>

          <div class="qr-code">
            QR: ${permit.id}
          </div>
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
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surat-dispensasi-${permit.student.nis}-${permit.id.substring(0, 8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const previewLetter = () => {
    const html = generateLetterHTML();
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  if (variant === 'icon') {
    return (
      <div className="flex gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={previewLetter}
          title="Preview Surat"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={printLetter}
          title="Cetak Surat"
        >
          <Printer className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadLetter}
          title="Download Surat"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        onClick={previewLetter}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Preview Surat
      </Button>
      <Button 
        variant="outline" 
        onClick={printLetter}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Cetak Surat
      </Button>
      <Button 
        variant="outline" 
        onClick={downloadLetter}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
    </div>
  );
};
