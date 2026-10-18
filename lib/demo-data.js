export function seed() {
  return {
    profiles: [
      {
        id: 'siswa-demo',
        name: 'Sahabat Huma',
        email: 'siswa@example.test',
        role: 'student',
        active: true
      },
      {
        id: 'guru-demo',
        name: 'Ibu Ratna',
        email: 'guru@example.test',
        role: 'teacher',
        active: true
      },
      {
        id: 'admin-demo',
        name: 'Pengelola Huma',
        email: 'admin@example.test',
        role: 'admin',
        active: true
      }
    ],
    classes: [{ id: 'kelas-x', title: 'X · Kelas Demo', year: '2026/2027', active: true }],
    memberships: [{ id: 'm1', student_id: 'siswa-demo', class_id: 'kelas-x' }],
    assignments: [
      { id: 'a1', teacher_id: 'guru-demo', course_id: 'matematika' },
      { id: 'a2', teacher_id: 'guru-demo', course_id: 'bahasa' }
    ],
    courses: [
      {
        id: 'matematika',
        class_id: 'kelas-x',
        title: 'Matematika',
        description: 'Temukan pola. Pahami konsep. Pecahkan masalah.',
        color: 'blue',
        status: 'published'
      },
      {
        id: 'bahasa',
        class_id: 'kelas-x',
        title: 'Bahasa Indonesia',
        description: 'Merangkai gagasan, memahami cerita.',
        color: 'orange',
        status: 'published'
      },
      {
        id: 'inggris',
        class_id: 'kelas-x',
        title: 'Bahasa Inggris',
        description: 'Selangkah lebih dekat dengan dunia.',
        color: 'purple',
        status: 'published'
      },
      {
        id: 'ipa',
        class_id: 'kelas-x',
        title: 'Ilmu Pengetahuan Alam',
        description: 'Jelajahi sains di sekitar kita.',
        color: 'green',
        status: 'published'
      }
    ],
    chapters: [
      {
        id: 'bab-1',
        course_id: 'matematika',
        title: 'Bilangan Real',
        position: 1,
        status: 'published'
      },
      {
        id: 'bab-2',
        course_id: 'matematika',
        title: 'Fungsi dan Komposisi',
        position: 2,
        status: 'published'
      },
      {
        id: 'bab-3',
        course_id: 'matematika',
        title: 'Persamaan Linear',
        position: 3,
        status: 'published'
      },
      {
        id: 'bab-bahasa',
        course_id: 'bahasa',
        title: 'Teks Deskripsi',
        position: 1,
        status: 'published'
      }
    ],
    lessons: [
      {
        id: 'fungsi',
        chapter_id: 'bab-2',
        course_id: 'matematika',
        title: 'Memahami fungsi komposisi',
        position: 1,
        status: 'published',
        summary: 'Dua proses yang disusun berurutan dapat membentuk satu fungsi baru.'
      },
      {
        id: 'sifat',
        chapter_id: 'bab-2',
        course_id: 'matematika',
        title: 'Sifat-sifat fungsi komposisi',
        position: 2,
        status: 'published',
        summary: 'Urutan penyusunan fungsi memengaruhi hasilnya.'
      },
      {
        id: 'bilangan',
        chapter_id: 'bab-1',
        course_id: 'matematika',
        title: 'Mengenal bilangan real',
        position: 1,
        status: 'published',
        summary: 'Bilangan rasional dan irasional membentuk himpunan bilangan real.'
      }
    ],
    materials: [
      {
        id: 'materi-fungsi',
        lesson_id: 'fungsi',
        course_id: 'matematika',
        title: 'Dua fungsi, satu perjalanan',
        kind: 'text',
        status: 'published',
        body: [
          {
            type: 'paragraph',
            text: 'Bayangkan dua mesin. Mesin pertama mengalikan sebuah angka dengan 2. Mesin kedua menambahkan 3 pada hasilnya. Menjalankan kedua mesin secara berurutan adalah contoh komposisi fungsi.'
          },
          { type: 'formula', text: 'f(x) = 2x     g(x) = x + 3\n(g ∘ f)(x) = g(f(x)) = 2x + 3' },
          {
            type: 'table',
            rows: [
              ['Masukan x', 'f(x) = 2x', 'g(f(x)) = 2x + 3'],
              ['1', '2', '5'],
              ['2', '4', '7'],
              ['3', '6', '9']
            ]
          },
          {
            type: 'paragraph',
            text: 'Urutan itu penting. Jika mesin penambah 3 dijalankan lebih dulu, hasilnya menjadi 2x + 6. Coba bandingkan kedua hasil untuk x = 2.'
          }
        ]
      },
      {
        id: 'materi-sifat',
        lesson_id: 'sifat',
        course_id: 'matematika',
        title: 'Mengapa urutan penting?',
        kind: 'text',
        status: 'published',
        body: [
          {
            type: 'paragraph',
            text: 'Pada umumnya f(g(x)) tidak sama dengan g(f(x)). Komposisi fungsi tidak selalu komutatif. Coba gunakan dua fungsi pada materi sebelumnya untuk membuktikannya.'
          }
        ]
      },
      {
        id: 'materi-real',
        lesson_id: 'bilangan',
        course_id: 'matematika',
        title: 'Bilangan di sekitar kita',
        kind: 'text',
        status: 'published',
        body: [
          {
            type: 'paragraph',
            text: 'Bilangan real mencakup bilangan rasional seperti 1/2 dan bilangan irasional seperti √2. Keduanya dapat ditunjukkan pada garis bilangan.'
          }
        ]
      }
    ],
    questions: [
      {
        id: 'q1',
        course_id: 'matematika',
        title: 'Komposisi dasar',
        body: [{ type: 'paragraph', text: 'Jika f(x) = 2x dan g(x) = x + 3, berapakah g(f(4))?' }],
        options: ['7', '8', '11', '14'],
        answer: 2,
        explanation: 'f(4) = 8, kemudian g(8) = 8 + 3 = 11.',
        status: 'published'
      },
      {
        id: 'q2',
        course_id: 'matematika',
        title: 'Urutan fungsi',
        body: [{ type: 'paragraph', text: 'Dengan fungsi yang sama, berapakah f(g(4))?' }],
        options: ['11', '14', '8', '10'],
        answer: 1,
        explanation: 'g(4) = 7, kemudian f(7) = 2 × 7 = 14.',
        status: 'published'
      },
      {
        id: 'q3',
        course_id: 'matematika',
        title: 'Bentuk komposisi',
        body: [
          { type: 'paragraph', text: 'Jika f(x) = 2x dan g(x) = x + 3, bentuk g(f(x)) adalah…' }
        ],
        options: ['2x + 6', 'x + 6', '2x + 3', '3x + 2'],
        answer: 2,
        explanation: 'Substitusikan f(x) ke g: g(2x) = 2x + 3.',
        status: 'published'
      }
    ],
    quizzes: [
      {
        id: 'quiz-fungsi',
        course_id: 'matematika',
        lesson_id: 'fungsi',
        title: 'Kenali fungsi komposisi',
        category: 'Mapel Sekolah',
        description: 'Latihan singkat untuk menguatkan pemahamanmu.',
        question_ids: ['q1', 'q2', 'q3'],
        status: 'published'
      }
    ],
    progress: [],
    attempts: [],
    audit: []
  };
}
