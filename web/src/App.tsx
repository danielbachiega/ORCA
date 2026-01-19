import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { OffersPage } from './pages/OffersPage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { OfferCreatePage } from './pages/OfferCreatePage';
import { OfferEditPage } from './pages/OfferEditPage';
import { Toaster } from 'react-hot-toast';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/offers" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">ORCA</h1>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route
            path="/offers"
            element={
              <Layout>
                <OffersPage />
              </Layout>
            }
          />
          <Route
            path="/admin/offers/new"
            element={
              <Layout>
                <OfferCreatePage />
              </Layout>
            }
          />
          <Route
            path="/admin/offers/:offerId/edit"
            element={
              <Layout>
                <OfferEditPage />
              </Layout>
            }
          />
          <Route
            path="/offers/:offerId"
            element={
              <Layout>
                <OfferDetailPage />
              </Layout>
            }
          />
          <Route
            path="/"
            element={
              <Layout>
                <OffersPage />
              </Layout>
            }
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
