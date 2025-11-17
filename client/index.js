import { Grid } from 'gridjs-react';
import 'gridjs/dist/theme/mermaid.css'; // Or another theme

import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // This imports and registers all Chart.js components

// 3. Write the JavaScript to create and render the grid
new gridjs.Grid({
            columns: ['Name', 'Email'],
            data: [
              ['John', 'john@example.com'],
              ['Mike', 'mike@gmail.com']
            ]
          }).render(document.getElementById('table'));