import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const HourlyChart = ({ data }) => {
  const hourLabels = [
    '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
    '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'
  ];

  const chartData = data.map(item => ({
    ...item,
    hourLabel: hourLabels[item.hour] || `${item.hour}:00`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="hourLabel" angle={-45} textAnchor="end" height={70} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#27ae60" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default HourlyChart;