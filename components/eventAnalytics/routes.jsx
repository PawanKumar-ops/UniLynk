import { createBrowserRouter } from 'react-router'
import Root from './Root'
import OverviewPage from '../pages/OverviewPage'
import RegistrantsPage from '../pages/RegistrantsPage'
import TeamsPage from '../pages/TeamsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: OverviewPage },
      { path: 'registrants', Component: RegistrantsPage },
      { path: 'teams', Component: TeamsPage },
      { path: '*', Component: OverviewPage },
    ],
  },
])
