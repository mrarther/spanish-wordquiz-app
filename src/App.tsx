import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router'
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
    </main>
  )
}

const router = createBrowserRouter([
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
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
