import React from 'react'
import Login from '../Components/Login/Login'
import SignUp from '../Components/Signup/Signup'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Panel from '../Components/Pages/Panel'
import Stocks from '../Components/Pages/Stocks'
import Dashboard from '../Components/Pages/Dashboard'
import Portfolio from '../Components/Pages/Portfolio'

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/panel" element={<Panel />}>

            <Route index element={<Dashboard />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="portfolio" element={<Portfolio />} />


          </Route>
        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App