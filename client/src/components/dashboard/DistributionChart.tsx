import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Define color palette that matches Google's brand colors
const COLORS = [
  '#4285F4', // Google Blue
  '#34A853', // Google Green
  '#FBBC05', // Google Yellow
  '#EA4335', // Google Red
  '#5F6368', // Dark Gray 
  '#8AB4F8', // Light Blue
  '#81C995', // Light Green
  '#FDE293', // Light Yellow
  '#F28B82', // Light Red
  '#DADCE0', // Light Gray
];

// Generate lighter colors based on the primary palette for larger datasets
const EXTENDED_COLORS = [
  ...COLORS,
  '#C2D7FD', // Even lighter blue
  '#B8E6C9', // Even lighter green
  '#FEF0BD', // Even lighter yellow
  '#F9C4C0', // Even lighter red
  '#EEEEEE', // Even lighter gray
];

interface ChartItem {
  name: string;
  value: number;
}

interface DistributionChartProps {
  title: string;
  description?: string;
  data: ChartItem[];
  emptyMessage?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 shadow-lg rounded-md border text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value.toLocaleString()} ({payload[0].payload.percent}%)</p>
      </div>
    );
  }
  return null;
};

const DistributionChart: React.FC<DistributionChartProps> = ({ 
  title, 
  description, 
  data,
  emptyMessage = "No data available"
}) => {
  // Calculate percentages and sort data by value descending
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const processedData = data
    .map(item => ({
      ...item,
      percent: total > 0 ? `${Math.round((item.value / total) * 100)}` : '0'
    }))
    .sort((a, b) => b.value - a.value);

  if (processedData.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-google-sans">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex justify-center items-center min-h-[200px] text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-google-sans">{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${percent}%`}
                labelLine={false}
              >
                {processedData.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right"
                verticalAlign="middle" 
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DistributionChart;