import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router'
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
import { Stats } from './routes/Stats'
import { TestResult } from './routes/TestResult'
import { TestRun } from './routes/TestRun'
import { TestSetup } from './routes/TestSetup'
import { VocabQuiz } from './routes/VocabQuiz'
import { VocabResult } from './routes/VocabResult'
import { VocabSetup } from './routes/VocabSetup'

function Layout() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="mb-6 text-2xl font-bold">
        <Link to="/">Spanish Word Quiz</Link>
      </h1>
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
