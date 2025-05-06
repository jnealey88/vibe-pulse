import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataItem {
  name: string;
  value: number | string;
  secondary?: string | number; // For optional secondary metric
}

interface DataTableProps {
  title: string;
  description?: string;
  data: DataItem[];
  columns: {
    name: string;
    key: 'name' | 'value' | 'secondary';
    formatter?: (value: any) => string;
  }[];
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  description, 
  data,
  columns,
  emptyMessage = "No data available"
}) => {
  // Sort data by value in descending order by default
  const sortedData = [...data].sort((a, b) => {
    if (typeof a.value === 'number' && typeof b.value === 'number') {
      return b.value - a.value;
    }
    return String(b.value).localeCompare(String(a.value));
  });

  if (sortedData.length === 0) {
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
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => {
                  const value = item[column.key];
                  const formattedValue = column.formatter ? column.formatter(value) : value;
                  return (
                    <TableCell key={colIndex}>
                      {column.key === 'name' 
                        ? <span className="font-medium">{formattedValue}</span>
                        : formattedValue
                      }
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DataTable;