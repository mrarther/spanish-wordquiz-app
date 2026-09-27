import { createBrowserRouter, Link, NavLink, Outlet, RouterProvider } from 'react-router'
import { UpdatePrompt } from './components/UpdatePrompt'
import { ClozeManager } from './routes/ClozeManager'
import { ClozeQuiz } from './routes/ClozeQuiz'
import { ClozeResult } from './routes/ClozeResult'
import { ClozeSetup } from './routes/ClozeSetup'
import { ConjugationQuiz } from './routes/ConjugationQuiz'
import { ConjugationResult } from './routes/ConjugationResult'
import { ConjugationSetup } from './routes/ConjugationSetup'
import { Flashcards } from './routes/Flashcards'
import { Home } from './routes/Home'
import { Review } from './routes/Review'
import { Settings } from './routes/Settings'
import { Stats } from './routes/Stats'
import { TestResult } from './routes/TestResult'
import { TestRun } from './routes/TestRun'
import { TestSetup } from './routes/TestSetup'
import { VocabQuiz } from './routes/VocabQuiz'
import { VocabResult } from './routes/VocabResult'
import { VocabSetup } from './routes/VocabSetup'

const NAV = [
  { to: '/review', label: '復習' },
  { to: '/stats', label: '統計' },
  { to: '/settings', label: '設定' },
]

function Layout() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-bold sm:text-2xl">
          <Link to="/">Spanish Word Quiz</Link>
        </h1>
        <nav aria-label="メニュー" className="flex gap-4 text-sm">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'font-semibold text-ink' : 'text-link underline'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
      <UpdatePrompt />
    </main>
  )
}

// 本番は GitHub Pages のパス（/spanish-wordquiz-app）の下で動く
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/conjugation', element: <ConjugationSetup /> },
        { path: '/conjugation/quiz', element: <ConjugationQuiz /> },
        { path: '/conjugation/result', element: <ConjugationResult /> },
        { path: '/vocab', element: <VocabSetup /> },
        { path: '/vocab/cards', element: <Flashcards /> },
        { path: '/vocab/quiz', element: <VocabQuiz /> },
        { path: '/vocab/result', element: <VocabResult /> },
        { path: '/cloze', element: <ClozeSetup /> },
        { path: '/cloze/quiz', element: <ClozeQuiz /> },
        { path: '/cloze/result', element: <ClozeResult /> },
        { path: '/cloze/manage', element: <ClozeManager /> },
        { path: '/review', element: <Review /> },
        { path: '/stats', element: <Stats /> },
        { path: '/settings', element: <Settings /> },
        { path: '/test', element: <TestSetup /> },
        { path: '/test/run', element: <TestRun /> },
        { path: '/test/result', element: <TestResult /> },
      ],
    },
  ],
  { basename },
)

function App() {
  return <RouterProvider router={router} />
}

export default App
