import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const ChargerChart = ({ data }) => {
  const getBarColor = (rate) => {
    if (rate >= 80) return '#27ae60';
    if (rate >= 50) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="charger" width={80} />
        <Tooltip
          formatter={(value, name, props) => {
            if (name === 'totalStops') return [`${value} stops`, 'Total Stops'];
            return [value, name];
          }}
        />
        <Bar dataKey="totalStops" fill="#8884d8">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.successRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ChargerChart;