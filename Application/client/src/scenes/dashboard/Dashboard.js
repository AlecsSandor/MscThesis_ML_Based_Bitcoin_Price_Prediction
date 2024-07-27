import React from 'react'

// Material UI imports
import {
  Box,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  useMediaQuery,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward'
import SouthEastIcon from '@mui/icons-material/SouthEast'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'

// React Hooks
import { useState, useEffect } from 'react'

// Import the Networking functions
import { post, get, secondTicks } from '../../helpers/networkManager'

// Import the charts and some dummy data
import { LineChart, BarChart } from './components/Chart'
import data from './dummy.json'

// Creating the custom form style for the frequency buttons
const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  flexDirection: 'column-reverse',
  alignItems: 'center',
  margin: theme.spacing(1),
  '& .MuiFormControlLabel-label': {
    fontFamily: 'Poppins',
    fontSize: 'small',
    fontWeight: '300',
  },
}))

const Dashboard = () => {
  // Get Width of screen for mobile friendly
  const isMobile = useMediaQuery('(min-width:1200px)')

  // This stores the data of the last 10 signals which is formated as follows:
  const [messages, setMessages] = useState(null)

  // ----------------------------
  // Assign the dummy json data to a constant to be rendered when first accessing the app - this gets slowly overrinten as new live data flows in
  const dummyPlotData = data
  // ----------------------------

  // ----------------------------
  // Hook for the selected frequency value
  const [selectedValue, setSelectedValue] = useState('minute')
  // Handle a different frequency selection
  const handleChange = (event) => {
    setSelectedValue(event.target.value)
  }
  // ----------------------------

  // ----------------------------
  // General error state
  const [error, setError] = useState(null)
  // ----------------------------

  // ----------------------------
  // Hook which determines if there is an ongoing prediction process already running
  const [isRunning, setIsRunning] = useState({ message: false })
  // A func which sends a post request to check if there is a prediciton process going on and assigns the result to isRunning
  // [ is called when the app is first loaded and in other circumstances ]
  const checkIfRunning = async () => {
    try {
      const result = await post('/is_running', { key: selectedValue })
      setIsRunning(result)
      console.log('POST response:', result)
    } catch (err) {
      setError(err.message)
    }
  }
  // ----------------------------

  // ----------------------------
  // This func is called by the start/stop click handlerer to check if there is a process running or not
  const changeProcess = async (endpoint) => {
    try {
      const result = await post(endpoint, { frequency: selectedValue })
      checkIfRunning()
      console.log('POST response:', result)
    } catch (err) {
      setError(err.message)
    }
  }
  // Handles the action of the Start-Stop Button by checking if there is a process running and toggleling the state of isRunning
  const handleStartStopClick = async () => {
    isRunning.message
      ? changeProcess('/stop_fetch')
      : changeProcess('/start_fetch')
  }
  // ----------------------------

  // ----------------------------
  // Calling the checkIfRunning func at the start of the app and also getting the last prediction if there is an ongoing process on the server
  useEffect(() => {
    checkIfRunning()
    getLatestPredictionData()
  }, [])
  // Using a get request gets the data of the last prediction
  const getLatestPredictionData = async () => {
    try {
      const data = await get('/signals', { key: 'value' })
      let reversedData = data['signal_data'].reverse()
      setMessages(reversedData)
    } catch (err) {
      setError(err.message)
    }
  }
  // ----------------------------

  // ----------------------------
  // Use effect block for running the webSocket used to receive signal notifications
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')

    ws.onopen = () => {
      console.log('WebSocket connection opened')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      let reversedData = data['signal_data'].reverse()
      setMessages(reversedData)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
    }

    return () => {
      ws.close()
    }
  }, [])
  // ----------------------------

  // ----------------------------
  // Constant which stores the tick data for the live btc-usd chart
  const [tickData, setTickData] = useState(dummyPlotData)
  // Use effect block to start updating the live btc-usd tickData array
  useEffect(() => {
    const updateDataArray = async () => {
      try {
        const newData = await secondTicks()
        setTickData((prevArray) => {
          const updatedArray = [...prevArray, newData]
          if (updatedArray.length > 60) {
            updatedArray.shift() // Remove the oldest data point
          }
          return updatedArray
        })
      } catch (error) {
        setError(error)
      }
    }

    const intervalId = setInterval(updateDataArray, 1000)

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [])
  // ----------------------------

  return isMobile ? (
    // Main Wrapper of the whole app
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <section
        id='Dash'
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#141414',
          flexDirection: 'row',
          color: 'white',
        }}
      >
        {/* Wrapper for the main components ( Live Btc / Last Prediction / Settings ) */}
        <div
          style={{
            height: '100%',
            display: 'flex',
            width: '80%',
            flexDirection: 'column',
          }}
        >
          {/* Wrapper for the Live Btc / Settings ( Upper section ) */}
          <div
            style={{
              flex: '1',
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {/* Wrapper for the Live Btc */}
            <div
              style={{
                flex: '2',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <p style={{ margin: '0' }}>Live BTC-USD</p>
                <div
                  style={{ width: '100%', height: '100%', paddingTop: '20px' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '15px',
                    }}
                  >
                    {/* Live Btc-Usd Chart */}
                    <BarChart data={tickData} />
                  </div>
                </div>
              </div>
            </div>
            {/* Wrapper for the Settings */}
            <div
              style={{
                flex: '1',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <p style={{ margin: '0' }}>Settings</p>
                <div
                  style={{ width: '100%', height: '100%', paddingTop: '20px' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#1C1C1C',
                      borderRadius: '15px',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '20px',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Radio Buttons Form */}
                    <Box style={{ width: '100%' }}>
                      <FormControl
                        component='fieldset'
                        style={{ width: '100%' }}
                      >
                        <RadioGroup
                          row
                          value={selectedValue}
                          onChange={handleChange}
                        >
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            style={{ width: '100%' }}
                          >
                            <StyledFormControlLabel
                              value='minute'
                              control={
                                <Radio
                                  sx={{
                                    color: 'white', // Unchecked color
                                    '&.Mui-checked': {
                                      color: '#E1FC52', // Checked color
                                    },
                                  }}
                                />
                              }
                              label='Minute'
                            />
                            <StyledFormControlLabel
                              value='hour'
                              control={
                                <Radio
                                  sx={{
                                    color: 'white', // Unchecked color
                                    '&.Mui-checked': {
                                      color: '#E1FC52', // Checked color
                                    },
                                  }}
                                />
                              }
                              label='Hour'
                            />
                            <StyledFormControlLabel
                              value='day'
                              control={
                                <Radio
                                  sx={{
                                    color: 'white', // Unchecked color
                                    '&.Mui-checked': {
                                      color: '#E1FC52', // Checked color
                                    },
                                  }}
                                />
                              }
                              label='Day'
                            />
                          </Box>
                        </RadioGroup>
                      </FormControl>
                    </Box>

                    {/* Start/Stop Button */}
                    <Button
                      style={{ width: '100px', color: '#E1FC52' }}
                      onClick={handleStartStopClick}
                    >
                      {isRunning.message ? 'Stop' : 'Start'}
                    </Button>

                    {/* On going process animation */}
                    <Box>
                      {isRunning.message ? (
                        <div class='container'>
                          <div class='line'></div>
                          <div class='line d1'></div>
                          <div class='line d2'></div>
                          <div class='line d3'></div>
                          <div class='line d4'></div>
                          <div class='line d5'></div>
                        </div>
                      ) : (
                        <p>No ongoing processes.</p>
                      )}
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wrapper for the Predictions ( Lower section ) */}
          <div
            style={{
              flex: '1.2',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <p style={{ margin: '0' }}>Last Prediction</p>
              <div
                style={{ width: '100%', height: '100%', paddingTop: '20px' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    //background: '#1C1C1C',
                    borderRadius: '15px',
                  }}
                >
                  {/* Predictions Chart */}
                  <LineChart
                    historic={
                      messages != null && messages != 'No Signals.'
                        ? messages[0].historical_prices
                        : dummyPlotData
                    }
                    future={
                      messages != null && messages != 'No Signals.'
                        ? messages[0].future_prices
                        : []
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wrapper for the Signal component ( on the left ) */}
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexGrow: '1',
            flexDirection: 'column',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <p style={{ margin: '0' }}>Signals</p>
            <div style={{ width: '100%', height: '100%', paddingTop: '20px' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#1C1C1C',
                  borderRadius: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* For each signal in the messages const, render a div with relevant information */}
                {messages != null && messages != 'No Signals.' ? (
                  messages.map((message, index) => (
                    <div
                      className={`slide-box`}
                      style={{
                        width: '95%',
                        height: '60px',
                        background: '#3B3B3B',
                        marginTop: '3%',
                        marginLeft: '3%',
                        marginRight: '3%',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'row',
                        padding: '7px',
                        justifyContent: 'space-between',
                        justifyItems: 'flex-start',
                        alignItems: 'center',
                        opacity: 1 - index / 8,
                      }}
                    >
                      <div
                        style={{
                          width: '25%',
                          height: '100%',
                          borderRadius: '7px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(22,22,22,0.3)',
                        }}
                      >
                        {' '}
                        {message.signal === 'Buy' ? (
                          <ArrowOutwardIcon style={{ color: '#E1FC52' }} />
                        ) : message.signal === 'Sell' ? (
                          <SouthEastIcon style={{ color: '#FF6384' }} />
                        ) : (
                          <HourglassEmptyIcon style={{ color: '#ffffff80' }} />
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                          paddingLeft: '7px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                          <p
                            style={{
                              fontWeight: '600',
                              fontSize: '11px',
                              color:
                                message.signal === 'Buy'
                                  ? '#E1FC52'
                                  : message.signal === 'Sell'
                                  ? '#FF6384'
                                  : 'white',
                            }}
                          >
                            {message.signal}
                          </p>
                          <p
                            style={{
                              fontWeight: '200',
                              fontSize: '11px',
                              paddingLeft: '4px',
                            }}
                          >
                            Signal
                          </p>
                          <p
                            style={{
                              fontWeight: '600',
                              fontSize: '11px',
                              paddingLeft: '4px',
                              color: '#FF6384',
                            }}
                          >
                            {message.signal == 'Sell'
                              ? message.profit + '%'
                              : ''}
                          </p>
                        </div>

                        <p style={{ fontWeight: '200', fontSize: '10px' }}>
                          {message.time}
                        </p>
                      </div>

                      <div style={{ flexGrow: 1 }}></div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontWeight: '200',
                      fontSize: '11px',
                      padding: '10px',
                      paddingTop: '30px',
                    }}
                  >
                    No Signals Yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) : (
    // Main Wrapper of the whole app
    <div style={{ width: '100%', height: '100vh', overflowY: 'scroll' }}>
      <section
        id='Dash'
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#141414',
          flexDirection: 'column',
          color: 'white',
        }}
      >
        {/* Wrapper for the Settings */}
        <div
          style={{
            flex: '1',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {/* <p style={{ margin: '0' }}>Settings</p> */}
            <div style={{ width: '100%', height: '100%', paddingTop: '20px' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#1C1C1C',
                  borderRadius: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Radio Buttons Form */}
                <Box style={{ width: '100%' }}>
                  <FormControl component='fieldset' style={{ width: '100%' }}>
                    <RadioGroup
                      row
                      value={selectedValue}
                      onChange={handleChange}
                    >
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        style={{ width: '100%' }}
                      >
                        <StyledFormControlLabel
                          value='minute'
                          control={
                            <Radio
                              sx={{
                                color: 'white', // Unchecked color
                                '&.Mui-checked': {
                                  color: '#E1FC52', // Checked color
                                },
                              }}
                            />
                          }
                          label='Minute'
                        />
                        <StyledFormControlLabel
                          value='hour'
                          control={
                            <Radio
                              sx={{
                                color: 'white', // Unchecked color
                                '&.Mui-checked': {
                                  color: '#E1FC52', // Checked color
                                },
                              }}
                            />
                          }
                          label='Hour'
                        />
                        <StyledFormControlLabel
                          value='day'
                          control={
                            <Radio
                              sx={{
                                color: 'white', // Unchecked color
                                '&.Mui-checked': {
                                  color: '#E1FC52', // Checked color
                                },
                              }}
                            />
                          }
                          label='Day'
                        />
                      </Box>
                    </RadioGroup>
                  </FormControl>
                </Box>

                {/* Start/Stop Button */}
                <Button
                  style={{ width: '100px', color: '#E1FC52' }}
                  onClick={handleStartStopClick}
                >
                  {isRunning.message ? 'Stop' : 'Start'}
                </Button>

                {/* On going process animation */}
                <Box>
                  {isRunning.message ? (
                    <div class='container'>
                      <div class='line'></div>
                      <div class='line d1'></div>
                      <div class='line d2'></div>
                      <div class='line d3'></div>
                      <div class='line d4'></div>
                      <div class='line d5'></div>
                    </div>
                  ) : (
                    <p>No ongoing processes.</p>
                  )}
                </Box>
              </div>
            </div>
          </div>
        </div>
        {/* Wrapper for the Signal component ( on the left ) */}
        <div
          style={{
            // height: '100%',
            display: 'flex',
            flexGrow: '1',
            flexDirection: 'column',
            padding: '10px',
            paddingTop: '5px'
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              // height: '100%',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {/* <p style={{ margin: '0' }}>Signals</p> */}
            <div style={{ width: '100%'}}>
              <div
                style={{
                  width: '100%',
                  height: 'auto',
                  background: '#1C1C1C',
                  borderRadius: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* For each signal in the messages const, render a div with relevant information */}
                {messages != null && messages != 'No Signals.' ? (
                  messages.map((message, index) => (
                    <div
                      className={`slide-box`}
                      style={{
                        width: '95%',
                        height: '60px',
                        background: '#3B3B3B',
                        marginTop: '3%',
                        marginLeft: '3%',
                        marginRight: '3%',
                        marginBottom: '3%',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'row',
                        padding: '7px',
                        justifyContent: 'space-between',
                        justifyItems: 'flex-start',
                        alignItems: 'center',
                        opacity: 1 - index / 8,
                      }}
                    >
                      <div
                        style={{
                          width: '25%',
                          height: '100%',
                          borderRadius: '7px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(22,22,22,0.3)',
                        }}
                      >
                        {' '}
                        {message.signal === 'Buy' ? (
                          <ArrowOutwardIcon style={{ color: '#E1FC52' }} />
                        ) : message.signal === 'Sell' ? (
                          <SouthEastIcon style={{ color: '#FF6384' }} />
                        ) : (
                          <HourglassEmptyIcon style={{ color: '#ffffff80' }} />
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                          paddingLeft: '7px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                          <p
                            style={{
                              fontWeight: '600',
                              fontSize: '11px',
                              color:
                                message.signal === 'Buy'
                                  ? '#E1FC52'
                                  : message.signal === 'Sell'
                                  ? '#FF6384'
                                  : 'white',
                            }}
                          >
                            {message.signal}
                          </p>
                          <p
                            style={{
                              fontWeight: '200',
                              fontSize: '11px',
                              paddingLeft: '4px',
                            }}
                          >
                            Signal
                          </p>
                          <p
                            style={{
                              fontWeight: '600',
                              fontSize: '11px',
                              paddingLeft: '4px',
                              color: '#FF6384',
                            }}
                          >
                            {message.signal == 'Sell'
                              ? message.profit + '%'
                              : ''}
                          </p>
                        </div>

                        <p style={{ fontWeight: '200', fontSize: '10px' }}>
                          {message.time}
                        </p>
                      </div>

                      <div style={{ flexGrow: 1 }}></div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontWeight: '200',
                      fontSize: '11px',
                      padding: '10px',
                      paddingTop: '30px',
                      paddingBottom: '30px',
                    }}
                  >
                    No Signals Yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
