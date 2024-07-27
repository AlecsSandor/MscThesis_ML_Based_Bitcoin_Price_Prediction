// LineChart.js
import React from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register the required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// This js file contains the graph components - LineChart for the predictions and BarChart for the live btc-usd

export const LineChart = (props) => {
  // Utility function to combine datasets and align prices
  function combineDatasets(dataSet1, dataSet2) {
    // Extract and combine times
    let times = [
      ...new Set([
        ...dataSet1.map((entry) => entry.time),
        ...dataSet2.map((entry) => entry.time),
      ]),
    ].sort() // Sort to ensure chronological order

    // Create price arrays with null values for missing data
    let prices1 = times.map((time) => {
      const entry = dataSet1.find((item) => item.time === time)
      return entry ? parseFloat(entry.price.replace(/"/g, '')) : null
    })

    let prices2 = times.map((time) => {
      const entry = dataSet2.find((item) => item.time === time)
      return entry ? parseFloat(entry.price.replace(/"/g, '')) : null
    })
    times = times.slice(0, -40)
    prices1 = prices1.slice(0, -40)
    prices2 = prices2.slice(0, -40)
    return {
      times,
      prices1,
      prices2,
    }
  }

  // Utility function to find min and max values in the dataset
  function getMinMax(data1, data2) {
    const allPrices = [...data1, ...data2].filter((value) => value !== null)
    const minValue = Math.min(...allPrices)
    const maxValue = Math.max(...allPrices)
    return { minValue, maxValue }
  }

  // Process the datasets
  const { times, prices1, prices2 } = combineDatasets(
    props.historic,
    props.future
  )
  const { minValue, maxValue } = getMinMax(prices1, prices2)

  for (let i = 0; i < prices1.length; i++) {
    if (prices1[i] === null) {
      prices2[i - 1] = prices1[i - 1]
      break
    }
  }

  // Define your datasets
  const data = {
    labels: times,
    datasets: [
      {
        label: 'Dataset 1',
        data: prices1, // Show only up to the middle
        borderColor: 'rgba(225, 252, 82, 0.3)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Dataset 2',
        data: prices2, // Start from the middle
        borderColor: 'rgba(225, 252, 82, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        borderDash: [5, 5], // Dotted line style
        fill: false,
        pointRadius: 0,
      },
    ],
  }

  // Define the chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `Value: ${tooltipItem.raw}`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: false,
          text: '',
        },
        ticks: {
          display: false, // Hide y-axis ticks
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.1)', // Light grey color for the grid lines
          lineWidth: 0.5, // Thinner grid lines
          // Control the frequency of grid lines
          drawTicks: false,
          drawOnChartArea: true,
        },
      },
      y: {
        title: {
          display: false,
          text: '',
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.1)', // Light grey color for the grid lines
          lineWidth: 0.5, // Thinner grid lines
          drawTicks: false,
          drawOnChartArea: true,
        },
        beginAtZero: false,
        min: minValue - 0.05 * (maxValue - minValue), // Optionally set a little padding
        max: maxValue + 0.05 * (maxValue - minValue),
      },
    },
  }

  return <Line data={data} options={options} />
}

export const BarChart = (props) => {
  const tickPrices = props.data.map((item) => parseFloat(item.price))
  const tickTimes = props.data.map((item) => item.time)

  // Utility function to find min and max values in the dataset
  // Normalize function
  const normalize = (data, newMin, newMax) => {
    const oldMin = Math.min(...data)
    const oldMax = Math.max(...data)
    return data.map(
      (value) =>
        ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin
    )
  }

  const normalizedData = normalize(tickPrices, 10, 100)

  const labels = props.labels

  // Define your datasets
  const data = {
    labels: tickTimes,
    datasets: [
      {
        label: 'Dataset 1',
        data: normalizedData, // Show only up to the middle
        borderColor: 'rgba(225, 252, 82, 0)',
        backgroundColor: 'rgba(225, 252, 82, 0.8)',
        borderRadius: 100,
        borderSkipped: false,
        fill: false,
        pointRadius: 0,
      },
    ],
  }

  const options = {
    type: 'bar',
    data: normalizedData,
    plugins: {
      legend: {
        display: false,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        ticks: {
          display: false,
        },
      },
      y: {
        ticks: {
          display: false,
        },
      },
    },
  }

  return <Bar data={data} options={options} />
}
