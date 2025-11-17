import { Grid } from 'gridjs-react';
import 'gridjs/dist/theme/mermaid.css'; // Or another theme

import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // This imports and registers all Chart.js components

function MyGridComponent() {
  return (
    <Grid
      data={[
        ['John', 'john@example.com'],
        ['Mike', 'mike@gmail.com']
      ]}
      columns={['Name', 'Email']}
      search={true}
      pagination={{
        limit: 1,
      }}
    />
  );
}

new gridjs.Grid({
    columns: ['Name', 'Email'], // Define your column headers
    data: [ // Your data goes here
        ['John', 'john@example.com'],
        ['Mike', 'mike@gmail.com']
    ]
}).render(document.getElementById('myGrid'));