import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import 'font-awesome/css/font-awesome.min.css';
import UserList from './components/UserList';
import AddUser from './components/AddUser';
import EditUser from './components/EditUser';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Overview from './components/Overview';
import StockOverview from './components/StockOverview';
import AddStock from './components/AddStock';
import StockIn from './components/StockIn';
import StockOut from './components/StockOut';
import IssuedStock from './components/IssuedStock';
import Product from './components/Product';
import AddProduct from './components/AddProduct';
import EditProduct from './components/EditProduct';
import Gallery from './components/Gallery';
import AddGallery from './components/AddGallery';
import EditGallery from './components/EditGallery';
import Barang from './components/Barang';
import AddBarang from './components/AddBarang';
import EditBarang from './components/EditBarang';
import Teams from './components/Teams';
import AddTeams from './components/AddTeams';
import EditTeams from './components/EditTeams';
import HomePage from './components/HomePage';
import ProductPage from './components/ProductPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Periksa status login di localStorage
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    console.log('Status isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Route tanpa proteksi */}
        <Route path='/login' element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path='/register' element={<Register />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/homepage/product" element={<ProductPage />} />


        {/* Redirect root ke dashboard */}
        <Route
          path='/'
          element={<Navigate to="/homepage" replace />}
        />

        {/* Route dashboard dengan nested routes */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }
        >
          <Route path="overview" element={<Overview />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="users" element={<UserList />} />
          <Route path="product" element={<Product />} />
          <Route path="teams" element={<Teams />} />
          <Route path="barang" element={<Barang />} />
          <Route path="teams/add" element={<AddTeams />} />
          <Route path="barang/add" element={<AddBarang />} />
          <Route path="gallery/add" element={<AddGallery />} />
          <Route path="barang/edit/:id" element={<EditBarang />} />
          <Route path="teams/edit/:id" element={<EditTeams />} />
          <Route path="gallery/edit/:id" element={<EditGallery />} />
          <Route path="product/add" element={<AddProduct />} />
          <Route path="product/edit/:id" element={<EditProduct />} />
          <Route path="/dashboard/users/add" element={<AddUser />} />
          <Route path="/dashboard/users/edit/:id" element={<EditUser />} />
          <Route path="/dashboard/stock/overview" element={<StockOverview />} />
          <Route path="/dashboard/stock/overview/add" element={<AddStock />} />
          <Route path="/dashboard/stock/overview/out" element={<IssuedStock />} />
          <Route path="/dashboard/stock/in" element={<StockIn />} />
          <Route path="/dashboard/stock/out" element={<StockOut />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
