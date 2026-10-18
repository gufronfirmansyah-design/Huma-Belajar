// DAFTAR FITUR: tambahkan satu modul + satu entri di sini.
// routes = alamat yang ditangani. Menu muncul otomatis; izin tetap diperiksa backend.
export const features = [
  {
    key: 'accounts',
    label: 'Akun pengguna',
    icon: 'user',
    routes: ['accounts'],
    roles: ['admin'],
    group: 'manage',
    render: async () => (await import('./modules/accounts.js')).accountsPage(),
    bind: async () => (await import('./modules/accounts.js')).bindAccounts()
  },
  {
    key: 'bank',
    label: 'Impor bank soal',
    icon: 'quiz',
    routes: ['bank'],
    roles: ['admin', 'editor', 'teacher'],
    group: 'manage',
    render: async () => (await import('./modules/bank.js')).bankPage(),
    bind: async () => (await import('./modules/bank.js')).bindBank()
  },
  {
    key: 'shared-catalog',
    label: 'Katalog bersama',
    icon: 'book',
    routes: ['shared-catalog'],
    roles: ['admin', 'editor'],
    group: 'manage',
    render: async () => (await import('./modules/shared-catalog.js')).sharedCatalogPage(),
    bind: async (render) => (await import('./modules/shared-catalog.js')).bindSharedCatalog(render)
  },
  {
    key: 'schools',
    label: 'Sekolah & Akses',
    icon: 'school',
    routes: ['schools'],
    render: async () => (await import('./modules/schools.js')).schoolsPage(),
    bind: async (render) => (await import('./modules/schools.js')).bindSchools(render)
  },
  {
    key: 'home',
    label: 'Beranda',
    icon: 'home',
    routes: ['home'],
    mobile: true,
    render: async () => {
      const { user } = await import('./lib/store.js');
      return user.role === 'observer'
        ? (await import('./modules/dashboard.js')).progressPage()
        : (await import('./modules/home.js')).dashboard();
    },
    bind: async () => (await import('./modules/dashboard.js')).bindReports()
  },
  {
    key: 'learn',
    roles: ['student', 'teacher', 'admin', 'editor'],
    label: 'Belajar',
    icon: 'book',
    routes: ['learn', 'course', 'lesson'],
    mobile: true,
    render: async ({ route, id }) =>
      route === 'learn'
        ? (await import('./modules/catalog.js')).learn()
        : (await import('./modules/learning.js'))[route === 'course' ? 'coursePage' : 'lessonPage'](
            id
          ),
    bind: async (render) => {
      (await import('./modules/learning.js')).bindLearning(render);
      (await import('./modules/catalog.js')).bindCatalog();
    }
  },
  {
    key: 'practice',
    roles: ['student', 'teacher', 'admin', 'editor'],
    label: 'Latihan',
    icon: 'quiz',
    routes: ['practice', 'quiz', 'attempt'],
    mobile: true,
    render: async ({ route, id }) =>
      (await import('./modules/practice.js'))[
        { practice: 'practice', quiz: 'quizIntro', attempt: 'attemptPage' }[route]
      ](id),
    bind: async (render) => {
      (await import('./modules/practice.js')).bindPractice(render);
      (await import('./modules/learning.js')).bindLearning(render);
    }
  },
  {
    key: 'progress',
    roles: ['student', 'admin', 'observer'],
    label: 'Progres',
    icon: 'chart',
    routes: ['progress'],
    mobile: true,
    render: async () => (await import('./modules/dashboard.js')).progressPage(),
    bind: async () => (await import('./modules/dashboard.js')).bindReports()
  },
  {
    key: 'profile',
    label: 'Profil',
    icon: 'user',
    routes: ['profile'],
    mobile: true,
    render: async () => (await import('./modules/profile.js')).profilePage(),
    bind: async () => (await import('./modules/profile.js')).bindProfile()
  },
  {
    key: 'classes',
    label: 'Pilih kelas',
    icon: 'school',
    routes: ['classes'],
    hidden: true,
    render: async () => (await import('./modules/classes.js')).classesPage(),
    bind: async () => (await import('./modules/classes.js')).bindClasses()
  },
  {
    key: 'manage',
    label: 'Kelola',
    icon: 'gear',
    routes: ['manage'],
    roles: ['teacher', 'admin', 'editor'],
    mobile: true,
    group: 'manage',
    render: async ({ id, edit }) => (await import('./modules/manage.js')).manage(id, edit),
    bind: async () => (await import('./modules/manage.js')).bindManage()
  }
];
export const featureFor = (route) => features.find((f) => f.routes.includes(route));
export const allowedFeatures = (role) =>
  features.filter((f) => !f.hidden && (!f.roles || f.roles.includes(role)));
