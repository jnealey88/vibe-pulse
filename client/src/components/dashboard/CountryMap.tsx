import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CountryData {
  code: string;
  name: string;
  value: number;
}

interface CountryMapProps {
  title: string;
  description?: string;
  data: CountryData[];
  emptyMessage?: string;
}

const CountryMap: React.FC<CountryMapProps> = ({ 
  title, 
  description, 
  data,
  emptyMessage = "No country data available"
}) => {
  // Sort countries by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // Calculate total users
  const totalUsers = data.reduce((sum, item) => sum + item.value, 0);

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
        <div className="grid grid-cols-1 gap-4">
          {/* Simple table for now - we can implement a real map visualization later */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.slice(0, 10).map((country, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {country.code && (
                      <span className="mr-2">{getCountryFlag(country.code)}</span>
                    )}
                    {country.name}
                  </TableCell>
                  <TableCell>{country.value.toLocaleString()}</TableCell>
                  <TableCell>
                    {totalUsers > 0 
                      ? `${Math.round((country.value / totalUsers) * 100)}%` 
                      : '0%'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '';
  }
}

export default CountryMap;