import React from 'react'
import Navbar from './component/Navbar'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Navbar />} />
      </Routes>

    </>

  )
}

export default App