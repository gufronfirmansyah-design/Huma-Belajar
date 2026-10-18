// Tambahan demo tidak pernah dikirim ke database produksi.
// ID tetap menjaga progres/data demo lama ketika aplikasi diperbarui.
export function upgradeDemo(data) {
  if (data.demoCatalogVersion >= 2) return data;
  const add = (table, row) => {
    if (!data[table].some((item) => item.id === row.id)) data[table].push(row);
  };
  const samples = [
    {
      course: 'bahasa',
      chapter: 'bab-bahasa',
      chapterTitle: 'Teks Deskripsi',
      lesson: 'demo-deskripsi',
      title: 'Menggambarkan suasana dengan kata',
      summary: 'Detail yang tepat membantu pembaca membayangkan sebuah tempat.',
      text: 'Teks deskripsi menggambarkan objek, tempat, atau suasana secara terperinci. Contoh: “Halaman sekolah tampak hijau. Daun-daun bergerak pelan ditiup angin, sementara aroma tanah basah terasa setelah hujan.” Detail penglihatan, gerakan, dan penciuman membantu pembaca membayangkannya.',
      questions: [
        [
          'Kalimat mana yang paling jelas menggambarkan suasana?',
          [
            'Sekolah itu ada.',
            'Halaman sekolah hijau dan teduh.',
            'Saya pergi ke sekolah.',
            'Sekolah adalah tempat belajar.'
          ],
          1,
          'Kata hijau dan teduh memberi detail yang dapat dibayangkan pembaca.'
        ],
        [
          'Ungkapan “aroma tanah basah” melibatkan indra…',
          ['Penglihatan', 'Pendengaran', 'Penciuman', 'Peraba'],
          2,
          'Aroma dikenali melalui indra penciuman.'
        ]
      ]
    },
    {
      course: 'inggris',
      chapter: 'demo-bab-inggris',
      chapterTitle: 'Everyday English',
      lesson: 'demo-routines',
      title: 'Talking about daily routines',
      summary: 'Gunakan simple present untuk menceritakan kebiasaan.',
      text: 'Simple present dapat digunakan untuk kebiasaan sehari-hari. Contoh: “I read a book every day.” Untuk subjek he, she, atau it, kata kerja umumnya mendapat akhiran -s atau -es: “She reads a book every day.” Kata bantu do/does digunakan pada pertanyaan dan penyangkalan.',
      questions: [
        [
          'Pilih kalimat yang tepat.',
          [
            'She read every day.',
            'She reads every day.',
            'She reading every day.',
            'She to read every day.'
          ],
          1,
          'Subjek she menggunakan kata kerja reads pada kalimat simple present positif.'
        ],
        [
          'Lengkapi: They ___ to school every morning.',
          ['goes', 'going', 'go', 'to go'],
          2,
          'Subjek they menggunakan bentuk dasar go.'
        ]
      ]
    },
    {
      course: 'ipa',
      chapter: 'demo-bab-energi',
      chapterTitle: 'Energi di Sekitar Kita',
      lesson: 'demo-energy',
      title: 'Mengenal perubahan energi',
      summary: 'Energi dapat berubah bentuk dalam kegiatan sehari-hari.',
      text: 'Energi dapat berubah dari satu bentuk menjadi bentuk lain. Kipas angin mengubah energi listrik menjadi energi gerak serta sebagian menjadi panas dan bunyi. Panel surya mengubah energi cahaya menjadi listrik. Mengenali perubahan ini membantu kita memahami alat yang digunakan sehari-hari.',
      questions: [
        [
          'Perubahan energi utama pada kipas angin adalah…',
          [
            'Listrik menjadi gerak',
            'Gerak menjadi cahaya',
            'Panas menjadi listrik',
            'Bunyi menjadi panas'
          ],
          0,
          'Motor kipas memanfaatkan energi listrik untuk memutar baling-baling.'
        ],
        [
          'Panel surya memanfaatkan sumber energi…',
          ['Bunyi', 'Cahaya matahari', 'Angin', 'Bahan bakar'],
          1,
          'Panel surya mengubah energi cahaya matahari menjadi listrik.'
        ]
      ]
    }
  ];
  for (const s of samples) {
    add('chapters', {
      id: s.chapter,
      course_id: s.course,
      title: s.chapterTitle,
      position: 1,
      status: 'published'
    });
    add('lessons', {
      id: s.lesson,
      chapter_id: s.chapter,
      course_id: s.course,
      title: s.title,
      summary: s.summary,
      position: 1,
      status: 'published'
    });
    add('materials', {
      id: s.lesson + '-material',
      course_id: s.course,
      lesson_id: s.lesson,
      title: s.title,
      kind: 'text',
      status: 'published',
      body: [{ type: 'paragraph', text: s.text }]
    });
    const ids = s.questions.map(([text, options, answer, explanation], index) => {
      const id = s.lesson + '-q' + index;
      add('questions', {
        id,
        title: s.title + ' ' + (index + 1),
        course_id: s.course,
        body: [{ type: 'paragraph', text }],
        options,
        answer,
        explanation,
        status: 'published'
      });
      return id;
    });
    add('quizzes', {
      id: s.lesson + '-quiz',
      course_id: s.course,
      lesson_id: s.lesson,
      title: 'Mini latihan · ' + s.title,
      category: 'Mapel Sekolah',
      description: 'Soal contoh untuk mencoba alur belajar HUMA BELAJAR.',
      question_ids: ids,
      status: 'published'
    });
  }
  const exams = [
    {
      category: 'TKA',
      id: 'demo-tka',
      title: 'Latihan numerasi · Contoh TKA',
      questions: [
        [
          'Dari 40 siswa, 25% mengikuti klub sains. Berapa siswa yang mengikuti klub?',
          ['5', '10', '15', '20'],
          1,
          '25% × 40 = 10 siswa.'
        ],
        [
          'Rata-rata dari 6, 8, dan 10 adalah…',
          ['6', '7', '8', '9'],
          2,
          'Jumlahnya 24. Dibagi 3 menghasilkan 8.'
        ]
      ]
    },
    {
      category: 'UTBK',
      id: 'demo-utbk',
      title: 'Penalaran kuantitatif · Contoh UTBK',
      questions: [
        [
          'Sebuah pola bilangan: 3, 6, 12, 24, … Bilangan berikutnya adalah…',
          ['30', '36', '42', '48'],
          3,
          'Setiap bilangan dikalikan 2. Jadi 24 × 2 = 48.'
        ],
        [
          'Harga 3 buku adalah Rp24.000. Dengan harga satuan sama, harga 5 buku adalah…',
          ['Rp32.000', 'Rp36.000', 'Rp40.000', 'Rp48.000'],
          2,
          'Harga satu buku Rp8.000. Lima buku berharga Rp40.000.'
        ]
      ]
    },
    {
      category: 'Kedinasan',
      id: 'demo-kedinasan',
      title: 'Logika dasar · Contoh Kedinasan',
      questions: [
        [
          'Semua anggota tim membawa buku. Rani adalah anggota tim. Kesimpulan yang pasti benar adalah…',
          [
            'Rani membawa buku.',
            'Hanya Rani membawa buku.',
            'Semua pembawa buku anggota tim.',
            'Rani tidak membawa buku.'
          ],
          0,
          'Karena semua anggota tim membawa buku dan Rani termasuk anggota, Rani membawa buku.'
        ],
        [
          'Jika hari ini Senin, tiga hari setelah hari ini adalah…',
          ['Selasa', 'Rabu', 'Kamis', 'Jumat'],
          2,
          'Satu hari: Selasa. Dua hari: Rabu. Tiga hari: Kamis.'
        ]
      ]
    }
  ];
  for (const s of exams) {
    const ids = s.questions.map(([text, options, answer, explanation], index) => {
      const id = s.id + '-q' + index;
      add('questions', {
        id,
        title: s.title + ' ' + (index + 1),
        course_id: 'matematika',
        body: [{ type: 'paragraph', text }],
        options,
        answer,
        explanation,
        status: 'published'
      });
      return id;
    });
    add('quizzes', {
      id: s.id,
      course_id: 'matematika',
      title: s.title,
      category: s.category,
      description:
        'Contoh interaktif untuk mencoba aplikasi, bukan simulasi lengkap atau soal resmi ujian.',
      question_ids: ids,
      status: 'published'
    });
  }
  data.demoCatalogVersion = 2;
  return data;
}
