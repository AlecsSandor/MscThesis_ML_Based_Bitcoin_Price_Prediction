import React from 'react'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'

// Material UI imports
import {
  useMediaQuery,
} from '@mui/material'

const Sidemenu = () => {
  // Get Width of screen for mobile friendly
  const isMobile = useMediaQuery('(min-width:1200px)')

  return (
    isMobile ? (
    // Wrapper for the sidemenu
    <div
      style={{
        width: '80px',
        height: '100vh',
        overflow: 'hidden',
        background: '#1C1C1C',
      }}
    >
      <SpaceDashboardIcon
        style={{ marginTop: '20px', fontSize: '40', color: 'white' }}
      />
    </div>
    ) : (<div></div>)
  )
}

export default Sidemenu
