import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router'
import { ConjugationQuiz } from './routes/ConjugationQuiz'
import { ConjugationResult } from './routes/ConjugationResult'
import { ConjugationSetup } from './routes/ConjugationSetup'
import { Home } from './routes/Home'

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
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
